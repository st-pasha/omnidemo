from __future__ import annotations
from pydantic import BaseModel

from omnidemo.api.insights import router
from omnidemo.db import SqliteDatabase
from fastapi import Request


class Insight(BaseModel):
    id: int
    message: str
    username: str
    created_at: str


class ListInsightsResponse(BaseModel):
    insights: list[Insight]


@router.get("/insights/list-insights")
async def list_insights(request: Request) -> ListInsightsResponse:
    db = SqliteDatabase.from_app(request.app)
    data = db.fetch_rows("SELECT * FROM insights")
    return ListInsightsResponse(
        insights=[Insight.model_validate(row) for row in data],
    )
