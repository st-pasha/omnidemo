from __future__ import annotations
from typing import Literal
from fastapi import HTTPException
from pydantic import BaseModel

from omnidemo.api.insights import router
from fastapi import Request


class Job(BaseModel):
    id: str
    progress: float
    status: Literal["running", "completed", "failed"]
    error: str | None = None
    created_at: str


class GetJobResponse(BaseModel):
    job: Job


@router.get("/jobs/get-job")
async def get_job(id: str, request: Request) -> GetJobResponse:
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    data = db.table("jobs").select("*").eq("id", id).execute()
    if not data.data:
        raise HTTPException(status_code=404, detail="Job not found")

    return GetJobResponse(job=Job(**data.data[0]))
