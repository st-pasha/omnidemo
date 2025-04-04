from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.insights import router
from omnidemo.api.insights.list_insights import Insight
from omnidemo.db import SqliteDatabase


class SendMessageRequest(BaseModel):
    message: str
    username: str  # In real app, we'll get the username from the auth token


class SendMessageResponse(BaseModel):
    insight: Insight


@router.post("/insights/send-message")
async def send_message(
    body: SendMessageRequest, request: Request
) -> SendMessageResponse:
    db = SqliteDatabase.from_app(request.app)

    row = db.insert_row(
        """
        INSERT INTO insights (message, username)
        VALUES (?, ?)
        """,
        (body.message.strip(), body.username),
    )
    return SendMessageResponse(insight=Insight.model_validate(row))
