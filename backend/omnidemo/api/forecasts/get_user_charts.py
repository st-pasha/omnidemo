from __future__ import annotations
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from fastapi import Request


class UserChart(BaseModel):
    id: int
    username: str
    chart_key: str
    created_at: str


class GetUserChartsResponse(BaseModel):
    charts: list[UserChart]


@router.get("/forecasts/get-user-charts")
async def get_user_charts(username: str, request: Request) -> GetUserChartsResponse:
    """
    Returns the list of chart descriptions for the given user.
    The charts themselves are not returned, only the metadata.
    """
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    response = db.table("user_charts").select("*").eq("username", username).execute()
    return GetUserChartsResponse(
        charts=[UserChart.model_validate(chart) for chart in response.data]
    )
