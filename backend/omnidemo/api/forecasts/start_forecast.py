from __future__ import annotations
import asyncio
import csv
import io
import random
from typing import cast
from fastapi import BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from omnidemo.api.forecasts import router
from omnidemo.api.forecasts.get_latest_forecast import Forecast
from omnidemo.api.jobs.get_job import Job
from omnidemo.db import SqliteDatabase


class StartForecastRequest(BaseModel):
    pass


class StartForecastResponse(BaseModel):
    forecast: Forecast
    job: Job


@router.post("/forecasts/start-forecast")
async def start_forecast(
    background_tasks: BackgroundTasks, request: Request
) -> StartForecastResponse:
    db = SqliteDatabase.from_app(request.app)

    # TODO: Check if there is already a forecast in progress
    # TODO: Also check if there is already a forecast from the latest
    #       version of the input file.
    # Note, I don't do it right now because for demo purposes we
    # want to be able to run the forecast at-will.
    pass

    # First create a job to track the progress of the forecast
    job_id = db.generate_uuid()
    db.execute(
        "INSERT INTO jobs (id, status) VALUES (?, ?)",
        (job_id, "running"),
    )
    row = db.fetch_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    job = Job.model_validate(row)

    # Also create a tentative forecast entry, so that people can see
    # that a forecast is in progress
    row = db.insert_row(
        "INSERT INTO forecasts (file_id, job_id, status) VALUES (?, ?, ?)",
        (None, job.id, "draft"),
    )
    forecast = Forecast.model_validate(row)

    # Run the forecast in the background
    background_tasks.add_task(run_forecast, db, job.id, forecast.id)

    return StartForecastResponse(forecast=forecast, job=job)


async def run_forecast(db: SqliteDatabase, job_id: str, forecast_id: int):
    async def update_job(progress: float):
        status = "running" if progress < 1.0 else "completed"
        db.execute(
            "UPDATE jobs SET progress = ?, status = ? WHERE id = ?",
            (progress, status, job_id),
        )
        # Add random delays to make it look like we work really hard
        # Also, at least a 0 delay is needed to allow other threads to
        # proceed
        await asyncio.sleep((1 + random.random()) * 0.5)  # ~ U[0.5, 1]

    try:
        # Locate the input file for the forecast
        rows = db.fetch_rows(
            "SELECT stored_name FROM inputs ORDER BY created_at DESC LIMIT 1"
        )
        if not rows:
            raise HTTPException(400, "No input files found")
        storage_id = cast(str, rows[0]["stored_name"])
        await update_job(0.1)

        # Collect the notes for the forecast
        rows = db.fetch_rows(
            "SELECT message FROM insights ORDER BY created_at ASC",
        )
        notes = [row["message"] for row in rows]
        await update_job(0.2)

        # Download the file from the backend storage
        file_content = (db.storage / storage_id).read_text()
        await update_job(0.4)

        # Parse the CSV file
        csv_file = io.StringIO(file_content)
        reader = csv.DictReader(csv_file)
        rows = [row for row in reader]
        await update_job(0.5)

        # Perform some processing on the parsed data (example)
        FORECAST_FACTOR = 3 if notes else 2
        out_rows: list[list[str]] = []
        for row in rows:
            forecast = float(row["forecast"]) * FORECAST_FACTOR
            del row["forecast"]
            out_rows.append(list(row.values()) + [str(forecast)])
        await update_job(0.6)

        # Create a CSV file with the forecast results
        target = db.storage / f"forecasts~{job_id}.csv"
        with open(target, "w", newline="", encoding="utf-8") as out:
            headers = [h for h in rows[0].keys() if h != "forecast"] + ["forecast"]
            writer = csv.writer(out)
            writer.writerow(headers)
            writer.writerows(out_rows)
            await update_job(0.8)

        # Update the entry in the forecasts table
        db.execute(
            """UPDATE forecasts SET file_id = ? WHERE id = ?""",
            (target.name, forecast_id),
        )
        await update_job(1.0)

    except Exception as e:
        # Update the job status to failed
        db.execute(
            "UPDATE jobs SET status = ?, error = ? WHERE id = ?",
            ("failed", str(e), job_id),
        )
