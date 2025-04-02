from __future__ import annotations
from pydantic import BaseModel
from fastapi import Form, Request, UploadFile, File, HTTPException
from omnidemo.api.inputs import router


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
    db = request.app.state.db
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")

    # Create an entry in the jobs table
    print("Creating job entry")
    db.table("jobs").insert({
        "id": job_id,
        "status": "running",
        "progress": 0,
    }).execute()

    print("Reading file")
    file_size_total = file.size or 1
    file_chunks: list[bytes] = []
    file_size_read = 0
    while chunk := await file.read(1024 * 1024):
        file_chunks.append(chunk)
        file_size_read += len(chunk)
        db.table("jobs").update({
            "progress": file_size_read / file_size_total,
        }).eq("id", job_id).execute()

    # Store the file in Supabase storage
    print("Uploading file into Supabase storage")
    file_id = job_id
    file_content = b"".join(file_chunks)
    target_name = f"uploads/{file.filename}/{file_id}"
    db.storage.from_("uploads").upload(target_name, file_content)

    # After uploading, create an entry in the `inputs` table
    print("Creating inputs entry")
    db.table("inputs").insert({
        "id": file_id,
        "file_name": file.filename,
        "stored_name": target_name,
        "username": username,
        "size": file_size_total,
    }).execute()

    # Update the job status to completed
    print("Updating job status to completed")
    db.table("jobs").update({
        "status": "completed",
        "progress": 1,
    }).eq("id", job_id).execute()

    print("File upload completed")
    return UploadFileResponse(file_id=file_id, file_size=file_size_total)
