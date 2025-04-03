from __future__ import annotations
from typing import AsyncGenerator
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse
from omnidemo.api.inputs import router
import supabase


@router.get("/inputs/download-file")
async def download_file(file_name: str, request: Request):
    db: supabase.Client = request.app.state.db
    assert db, "Database connection is not established"

    try:
        data = db.storage.from_("uploads").download(file_name)
    except supabase.exceptions.SupabaseStorageException as e:
        raise HTTPException(status_code=404, detail=f"File not found: {file_name}")

    async def file_generator() -> AsyncGenerator[bytes, None]:
        chunk_size = 1024 * 1024
        for i in range(0, len(data), chunk_size):
            yield data[i : i + chunk_size]

    return StreamingResponse(
        file_generator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment;filename={file_name}"},
    )
