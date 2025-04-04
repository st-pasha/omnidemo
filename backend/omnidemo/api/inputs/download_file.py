from __future__ import annotations
from typing import AsyncGenerator
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse

from omnidemo.api.inputs import router
from omnidemo.db import SqliteDatabase


@router.get("/inputs/download-file")
async def download_file(id: str, request: Request):
    db = SqliteDatabase.from_app(request.app)

    file = db.storage / id
    if file.exists():
        file_name = file.name
        stored_name = file.name
    else:
        row = db.fetch_one(
            """SELECT file_name, stored_name FROM inputs WHERE id = ?""", (id,)
        )
        file_name = row["file_name"]
        stored_name = row["stored_name"]

    path = db.storage / stored_name
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {stored_name}")

    async def file_generator() -> AsyncGenerator[bytes, None]:
        chunk_size = 1024 * 1024
        with open(path, mode="rb") as file:
            while chunk := file.read(chunk_size):
                yield chunk

    return StreamingResponse(
        file_generator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment;filename={file_name}"},
    )
