from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.forecasts.add_user_chart
import omnidemo.api.forecasts.get_chart
import omnidemo.api.forecasts.get_latest_forecast
import omnidemo.api.forecasts.get_user_charts
import omnidemo.api.forecasts.publish_forecast
import omnidemo.api.forecasts.start_forecast
