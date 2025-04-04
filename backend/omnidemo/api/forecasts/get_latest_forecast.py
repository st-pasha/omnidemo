from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel
from typing import Literal

from omnidemo.api.forecasts import router
from omnidemo.api.jobs.get_job import Job
from omnidemo.db import SqliteDatabase


class Forecast(BaseModel):
    id: int
    file_id: str | None
    job_id: str | None = None
    status: Literal["draft", "published"]
    created_at: str


class GetForecastResponse(BaseModel):
    forecast: Forecast | None
    job: Job | None


@router.get("/forecasts/get-latest-forecast")
async def get_latest_forecast(request: Request) -> GetForecastResponse:
    db = SqliteDatabase.from_app(request.app)

    # Get the latest forecast
    rows = db.fetch_rows("""
        SELECT * FROM forecasts
        ORDER BY created_at DESC LIMIT 1
        """)
    if not rows:
        return GetForecastResponse(forecast=None, job=None)

    forecast = Forecast.model_validate(rows[0])
    out = GetForecastResponse(forecast=forecast, job=None)

    # Get the job associated with the forecast
    if forecast.job_id:
        rows = db.fetch_rows(
            "SELECT * FROM jobs WHERE id = ?",
            (forecast.job_id,),
        )
        if rows:
            out.job = Job.model_validate(rows[0])

    return out
