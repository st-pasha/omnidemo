from __future__ import annotations
from fastapi import HTTPException
from pydantic import BaseModel

from omnidemo.api.insights import router
from fastapi import Request


class Input(BaseModel):
    id: str
    file_name: str
    username: str
    size: int
    created_at: str


class ListInputsResponse(BaseModel):
    inputs: list[Input]


@router.get("/inputs/list-inputs")
async def list_inputs(request: Request) -> ListInputsResponse:
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    data = db.table("inputs").select("*").execute()

    return ListInputsResponse(inputs=data.data)
