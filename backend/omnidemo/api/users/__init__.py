from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.users.login  # type: ignore[import]
