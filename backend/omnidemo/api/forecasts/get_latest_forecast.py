from __future__ import annotations
from typing import Literal
from omnidemo.api.jobs.get_job import Job
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from fastapi import Request


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
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    # Get the latest forecast
    response = (
        db.table("forecasts")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not response.data:
        return GetForecastResponse(forecast=None, job=None)

    forecast = Forecast.model_validate(response.data[0])
    out = GetForecastResponse(forecast=forecast, job=None)

    # Get the job associated with the forecast
    if forecast.job_id:
        response = db.table("jobs").select("*").eq("id", forecast.job_id).execute()
        if response.data:
            out.job = Job.model_validate(response.data[0])

    return out
