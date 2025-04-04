from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.forecasts.add_user_chart  # type: ignore[import]
import omnidemo.api.forecasts.get_chart  # type: ignore[import]
import omnidemo.api.forecasts.get_latest_forecast  # type: ignore[import]
import omnidemo.api.forecasts.get_user_charts  # type: ignore[import]
import omnidemo.api.forecasts.publish_forecast  # type: ignore[import]
import omnidemo.api.forecasts.start_forecast  # type: ignore[import]
