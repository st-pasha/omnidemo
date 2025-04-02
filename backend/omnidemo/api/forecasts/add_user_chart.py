from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from omnidemo.api.forecasts.get_user_charts import UserChart


class AddUserChartRequest(BaseModel):
    username: str
    chart_key: str


class AddUserChartResponse(BaseModel):
    chart: UserChart


@router.post("/forecasts/add-user-chart")
async def add_user_chart(
    body: AddUserChartRequest, request: Request
) -> AddUserChartResponse:
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    response = (
        db.table("user_charts")
        .insert({
            "username": body.username,
            "chart_key": body.chart_key,
        })
        .execute()
    )
    assert len(response.data) == 1, "Failed to insert user chart"

    return AddUserChartResponse(chart=UserChart.model_validate(response.data[0]))
