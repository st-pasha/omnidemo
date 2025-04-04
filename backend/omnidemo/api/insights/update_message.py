from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.insights import router
from omnidemo.api.insights.list_insights import Insight
from omnidemo.db import SqliteDatabase


class UpdateMessageRequest(BaseModel):
    message_id: int
    message: str
    username: str


class UpdateMessageResponse(BaseModel):
    insight: Insight


@router.post("/insights/update-message")
async def update_message(
    body: UpdateMessageRequest, request: Request
) -> UpdateMessageResponse:
    db = SqliteDatabase.from_app(request.app)

    db.execute(
        """
        UPDATE insights
        SET message = ?
        WHERE id = ? AND username = ?
        """,
        (body.message.strip(), body.message_id, body.username),
    )
    row = db.fetch_one(
        "SELECT * FROM insights WHERE id = ?",
        (body.message_id,),
    )

    return UpdateMessageResponse(insight=Insight.model_validate(row))
