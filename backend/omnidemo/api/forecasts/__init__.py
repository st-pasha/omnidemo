from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.forecasts.get_latest_forecast
import omnidemo.api.forecasts.start_forecast
