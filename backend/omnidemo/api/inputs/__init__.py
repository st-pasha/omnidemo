from fastapi import APIRouter

router = APIRouter()

import omnidemo.api.inputs.download_file  # type: ignore[import]
import omnidemo.api.inputs.list_inputs  # type: ignore[import]
import omnidemo.api.inputs.upload_file  # type: ignore[import]
