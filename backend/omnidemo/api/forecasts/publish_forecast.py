from __future__ import annotations
from fastapi import Request
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from omnidemo.api.forecasts.get_latest_forecast import Forecast
from omnidemo.db import SqliteDatabase


class PublishForecastRequest(BaseModel):
    id: int


class PublishForecastResponse(BaseModel):
    forecast: Forecast


@router.post("/forecasts/publish-forecast")
async def get_latest_forecast(
    body: PublishForecastRequest, request: Request
) -> PublishForecastResponse:
    # TODO: also check that the user has permission for publishing
    db = SqliteDatabase.from_app(request.app)

    db.execute(
        """
        UPDATE forecasts SET status = 'published' WHERE id = ?
        """,
        (body.id,),
    )
    row = db.fetch_one(
        """
        SELECT * FROM forecasts WHERE id = ?
        """,
        (body.id,),
    )
    forecast = Forecast.model_validate(row)

    return PublishForecastResponse(forecast=forecast)
