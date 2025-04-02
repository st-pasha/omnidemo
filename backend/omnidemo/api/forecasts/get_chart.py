from __future__ import annotations
from collections import defaultdict
import csv
import io
from typing import Any
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from fastapi import HTTPException, Request
import supabase


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
    db: supabase.Client = request.app.state.db
    assert db is not None, "Database connection is not established"

    # TODO: prevent two users from requesting the same chart at the same time
    # Also, should we return a job here?

    # See if the chart is already in the database, and if so return it
    print("Check if the chart is in the DB")
    response = (
        db.table("charts")
        .select("*")
        .eq("chart_key", chart_key)
        .eq("forecast_id", forecast_id)
        .execute()
    )
    if response.data:
        return GetChartResponse(chart=Chart.model_validate(response.data[0]))

    # Otherwise, we need to compute the chart's data
    print("Parse the chart key")
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

    print(f"  fields: {fields}, agg = {agg}")
    if len(fields) < 2:
        raise HTTPException(
            status_code=400,
            detail="Chart key must contain at least two fields",
        )

    # Find the name of the file that has the full forecast data
    response = db.table("forecasts").select("file_id").eq("id", forecast_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Forecast not found")
    forecast_file_id = response.data[0]["file_id"]

    # Load the data from the Supabase storage
    print(f"Load forecast data from storage `{forecast_file_id}`")
    file_content = db.storage.from_("uploads").download(forecast_file_id)
    csv_file = io.StringIO(file_content.decode("utf-8"))
    reader = csv.DictReader(csv_file)
    data = [[row.get(header) for header in fields] for row in reader]

    # Aggregate the y-data by groups in x-data.
    print("Aggregate the data")
    print("  data: ", data[:5])
    aggregated_data = defaultdict(list)
    for row in data:
        x_value = tuple(row[:-1])
        y_value = row[-1]
        if y_value:
            aggregated_data[x_value].append(y_value)
    agg_fn = {
        "sum": agg_sum,
        "avg": agg_avg,
        "min": agg_min,
        "max": agg_max,
        "count": agg_count,
    }[agg]
    data = [[*k, agg_fn(v)] for k, v in aggregated_data.items()]
    print(f"  after aggregation, the data has {len(data)} rows")
    print("  data: ", data[:5])

    # Save the chart data
    print("Save the chart data")
    response = (
        db.table("charts")
        .insert({
            "forecast_id": forecast_id,
            "chart_key": chart_key,
            "data": data,
        })
        .execute()
    )
    assert len(response.data) == 1

    # Return the chart to the user
    print("Done")
    chart = Chart.model_validate(response.data[0])
    return GetChartResponse(chart=chart)


def agg_sum(data: list[str]) -> float:
    return sum(float(v) for v in data)


def agg_avg(data: list[str]) -> float:
    return agg_sum(data) / len(data)


def agg_count(data: list[str]) -> int:
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
