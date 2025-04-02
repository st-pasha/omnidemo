from __future__ import annotations
from fastapi import HTTPException, Request
from pydantic import BaseModel

from omnidemo.api.insights import router
from omnidemo.api.insights.list_insights import Insight


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
    db = request.app.state.db

    response = (
        db.table("insights")
        .update({
            "message": body.message.strip(),
        })
        .eq("id", body.message_id)
        .eq("username", body.username)
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=404, detail="Message not found or not authorized to update"
        )

    return UpdateMessageResponse(insight=response.data[0])
