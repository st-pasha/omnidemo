from __future__ import annotations
from fastapi import HTTPException
from pydantic import BaseModel

from omnidemo.api.insights import router
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
    db = request.app.state.db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    data = db.table("insights").select("*").execute()

    return ListInsightsResponse(insights=data.data)
