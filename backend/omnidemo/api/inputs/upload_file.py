from __future__ import annotations
from pathlib import Path
from pydantic import BaseModel
from fastapi import Form, Request, UploadFile, File, HTTPException

from omnidemo.api.inputs import router
from omnidemo.db import SqliteDatabase


class UploadFileResponse(BaseModel):
    file_id: str
    file_size: int


@router.post("/inputs/upload-file")
async def upload_file(
    request: Request,
    username: str = Form(...),
    job_id: str = Form(...),
    file: UploadFile = File(...),
) -> UploadFileResponse:
    db = SqliteDatabase.from_app(request.app)
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")

    # Create an entry in the jobs table
    db.execute(
        "INSERT INTO jobs (id, status, progress) VALUES (?, ?, ?)",
        (job_id, "running", 0),
    )

    # Read the file and save it to the local storage directory
    f = Path(file.filename or "")
    target = db.storage / f"{f.stem}~{job_id}{'.'.join(f.suffixes)}"
    file_size_total = file.size or 1
    file_size_read = 0
    with open(target, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            out.write(chunk)
            file_size_read += len(chunk)
            db.execute(
                "UPDATE jobs SET progress = ? WHERE id = ?",
                (file_size_read / file_size_total, job_id),
            )

    # After uploading, create an entry in the `inputs` table
    db.execute(
        """
        INSERT INTO inputs (id, file_name, stored_name, username, size) 
        VALUES (?, ?, ?, ?, ?)
        """,
        (job_id, file.filename, target.name, username, file_size_total),
    )

    # Update the job status to completed
    db.execute(
        """
        UPDATE jobs SET status = ?, progress = ? WHERE id = ?
        """,
        ("completed", 1, job_id),
    )

    return UploadFileResponse(file_id=job_id, file_size=file_size_total)
