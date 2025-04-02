from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.insights.list_insights
import omnidemo.api.insights.send_message
import omnidemo.api.insights.update_message
