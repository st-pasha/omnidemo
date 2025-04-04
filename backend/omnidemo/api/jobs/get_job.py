from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel
from typing import Literal

from omnidemo.api.jobs import router
from omnidemo.db import SqliteDatabase


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
    db = SqliteDatabase.from_app(request.app)
    row = db.fetch_one("SELECT * FROM jobs WHERE id = ?", (id,))
    return GetJobResponse(job=Job.model_validate(row))
