from __future__ import annotations
import asyncio
import csv
import io
from collections import defaultdict
import json
from fastapi import HTTPException, Request
from pydantic import BaseModel
from typing import Any, Callable, cast

from omnidemo.api.forecasts import router
from omnidemo.db import SqliteDatabase


class Chart(BaseModel):
    id: int
    forecast_id: int
    # Chart key is a list of fields, separated by commas. The final field
    # is the y-axis, and the rest are the x-axis + optional categories.
    # The final field may contain the aggregation function, e.g. `count/field`.
    # All aggregations skip over empty values. If the aggregation function is not
    # specified, the default is `sum`.
    # Example: `sku,region,count/forecast`.
    chart_key: str
    data: Any
    created_at: str


class GetChartResponse(BaseModel):
    chart: Chart


@router.get("/forecasts/get-chart")
async def get_chart(
    forecast_id: int, chart_key: str, request: Request
) -> GetChartResponse:
    """
    Returns the list of chart descriptions for the given user.
    The charts themselves are not returned, only the metadata.
    """
    db = SqliteDatabase.from_app(request.app)

    # TODO: prevent two users from requesting the same chart at the same time
    # Also, should we return a job here?

    # See if the chart is already in the database, and if so return it
    rows = db.fetch_rows(
        """
        SELECT * FROM charts WHERE chart_key = ? AND forecast_id = ?
        """,
        (chart_key, forecast_id),
    )
    if rows:
        return GetChartResponse(chart=Chart.model_validate(rows[0]))

    # Otherwise, we need to compute the chart's data
    fields = chart_key.split(",")
    agg = "sum"
    if "/" in fields[-1]:
        agg, field = fields[-1].split("/", 1)
        fields[-1] = field
    if agg not in ["sum", "avg", "min", "max", "count"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported aggregation function: {agg}",
        )

    if len(fields) < 2:
        raise HTTPException(
            status_code=400,
            detail="Chart key must contain at least two fields",
        )

    # Find the name of the file that has the full forecast data
    # If the forecast is not ready yet, then wait for it to be ready
    while True:
        row = db.fetch_one(
            "SELECT file_id FROM forecasts WHERE id = ?",
            (forecast_id,),
        )
        forecast_file_id = cast(str, row["file_id"])
        if forecast_file_id:
            break
        await asyncio.sleep(1)

    # Load the data from the Supabase storage
    file_content = (db.storage / forecast_file_id).read_text()
    csv_file = io.StringIO(file_content)
    reader = csv.DictReader(csv_file)
    data = [[row.get(header) for header in fields] for row in reader]

    # Aggregate the y-data by groups in x-data.
    aggregated_data: dict[tuple[Any, ...], list[str]] = defaultdict(list)
    for row in data:
        x_value = tuple(row[:-1])
        y_value = row[-1]
        if y_value:
            aggregated_data[x_value].append(y_value)
    agg_fn: Callable[[list[str]], float] = {
        "sum": agg_sum,
        "avg": agg_avg,
        "min": agg_min,
        "max": agg_max,
        "count": agg_count,
    }[agg]
    agg_data: list[list[Any]] = [[*k, agg_fn(v)] for k, v in aggregated_data.items()]

    # Save the chart data
    row = db.insert_row(
        """
        INSERT INTO charts (forecast_id, chart_key, data)
        VALUES (?, ?, ?)
        """,
        (forecast_id, chart_key, json.dumps(agg_data)),
    )

    # Return the chart to the user
    chart = Chart.model_validate(row)
    return GetChartResponse(chart=chart)


def agg_sum(data: list[str]) -> float:
    return sum(float(v) for v in data)


def agg_avg(data: list[str]) -> float:
    return agg_sum(data) / len(data)


def agg_count(data: list[str]) -> float:
    return len(data)


def agg_min(data: list[str]) -> float:
    min_value = float("inf")
    for v in data:
        min_value = min(min_value, float(v))
    return min_value


def agg_max(data: list[str]) -> float:
    max_value = float("-inf")
    for v in data:
        max_value = max(max_value, float(v))
    return max_value
