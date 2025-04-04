from __future__ import annotations
from omnidemo.db import SqliteDatabase
from pydantic import BaseModel

from omnidemo.api.inputs import router
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
    db = SqliteDatabase.from_app(request.app)
    rows = db.fetch_rows("SELECT * FROM inputs")
    return ListInputsResponse(inputs=[Input.model_validate(row) for row in rows])
