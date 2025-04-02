from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.insights import router
from omnidemo.api.insights.list_insights import Insight


class SendMessageRequest(BaseModel):
    message: str
    username: str  # In real app, we'll get the username from the auth token


class SendMessageResponse(BaseModel):
    insight: Insight


@router.post("/insights/send-message")
async def send_message(
    body: SendMessageRequest, request: Request
) -> SendMessageResponse:
    db = request.app.state.db

    response = (
        db.table("insights")
        .insert({
            "message": body.message.strip(),
            "username": body.username,
        })
        .execute()
    )
    assert len(response.data) == 1

    return SendMessageResponse(insight=response.data[0])
