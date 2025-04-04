from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from omnidemo.api.forecasts.get_user_charts import UserChart
from omnidemo.db import SqliteDatabase


class AddUserChartRequest(BaseModel):
    username: str
    chart_key: str


class AddUserChartResponse(BaseModel):
    chart: UserChart


@router.post("/forecasts/add-user-chart")
async def add_user_chart(
    body: AddUserChartRequest, request: Request
) -> AddUserChartResponse:
    db = SqliteDatabase.from_app(request.app)

    data = db.insert_row(
        """
        INSERT INTO user_charts (username, chart_key)
        VALUES (?, ?)
        """,
        (body.username, body.chart_key),
    )

    return AddUserChartResponse(chart=UserChart.model_validate(data))
