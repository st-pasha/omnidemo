from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.insights.list_insights  # type: ignore[import]
import omnidemo.api.insights.send_message  # type: ignore[import]
import omnidemo.api.insights.update_message  # type: ignore[import]
