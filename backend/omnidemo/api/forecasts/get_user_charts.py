from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from omnidemo.db import SqliteDatabase


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
    db = SqliteDatabase.from_app(request.app)

    rows = db.fetch_rows("SELECT * FROM user_charts WHERE username = ?", (username,))
    return GetUserChartsResponse(charts=[UserChart.model_validate(row) for row in rows])
