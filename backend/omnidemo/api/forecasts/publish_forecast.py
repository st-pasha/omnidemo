from __future__ import annotations
from omnidemo.api.forecasts.get_latest_forecast import Forecast
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from fastapi import HTTPException, Request


class PublishForecastRequest(BaseModel):
    id: int


class PublishForecastResponse(BaseModel):
    forecast: Forecast


@router.post("/forecasts/publish-forecast")
async def get_latest_forecast(
    body: PublishForecastRequest, request: Request
) -> PublishForecastResponse:
    # TODO: also check that the user has permission for publishing
    db = request.app.state.db
    assert db is not None, "Database connection is not established"

    response = (
        db.table("forecasts")
        .update({"status": "published"})
        .eq("id", body.id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Forecast not found")
    forecast = Forecast.model_validate(response.data[0])

    return PublishForecastResponse(forecast=forecast)
