from __future__ import annotations
import asyncio
import csv
import io
import random
import time
from omnidemo.api.jobs.get_job import Job
import supabase
from fastapi import BackgroundTasks, HTTPException, Request
from omnidemo.api.forecasts.get_latest_forecast import Forecast
from pydantic import BaseModel

from omnidemo.api.forecasts import router


class StartForecastRequest(BaseModel):
    pass


class StartForecastResponse(BaseModel):
    forecast: Forecast
    job: Job


@router.post("/forecasts/start-forecast")
async def start_forecast(
    background_tasks: BackgroundTasks, request: Request
) -> StartForecastResponse:
    db = request.app.state.db
    # TODO: Check if there is already a forecast in progress
    # TODO: Also check if there is already a forecast from the latest
    #       version of the input file.
    # Note, I don't do it right now because for demo purposes we
    # want to be able to run the forecast at-will.
    pass

    # First create a job to track the progress of the forecast
    response = db.table("jobs").insert({"status": "running"}).execute()
    assert len(response.data) == 1
    job = Job.model_validate(response.data[0])

    # Also create a tentative forecast entry, so that people can see
    # that a forecast is in progress
    response = (
        db.table("forecasts")
        .insert({"file_id": None, "job_id": job.id, "status": "draft"})
        .execute()
    )
    assert len(response.data) == 1
    forecast = Forecast.model_validate(response.data[0])

    # Run the forecast in the background
    background_tasks.add_task(run_forecast, db, job.id, forecast.id)

    return StartForecastResponse(forecast=forecast, job=job)


async def run_forecast(db: supabase.Client, job_id: str, forecast_id: str):
    async def update_job(progress: float):
        update = {"progress": progress}
        if progress >= 1.0:
            update["status"] = "completed"
        db.table("jobs").update(update).eq("id", job_id).execute()
        # Add random delays to make it look like we work really hard
        # Also, at least a 0 delay is needed to allow other threads to
        # proceed
        await asyncio.sleep((1 + random.random()) * 0.5)  # ~ U[0.5, 1]

    try:
        # Locate the input file for the forecast
        response = (
            db.table("inputs")
            .select("id,stored_name")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise HTTPException("No input files found")
        file_id = response.data[0]["id"]
        storage_id = response.data[0]["stored_name"]
        await update_job(0.1)

        # Collect the notes for the forecast
        response = (
            db.table("insights")
            .select("message")
            .order("created_at", desc=False)
            .execute()
        )
        notes = [row["message"] for row in response.data]
        await update_job(0.2)

        # Download the file from Supabase storage
        print(f"Downloading `{storage_id}` from Supabase storage")
        file_content = db.storage.from_("uploads").download(storage_id)
        await update_job(0.4)

        # Parse the CSV file
        print("Parsing the CSV file")
        csv_file = io.StringIO(file_content.decode("utf-8"))
        reader = csv.DictReader(csv_file)
        rows = [row for row in reader]
        await update_job(0.5)

        # Perform some processing on the parsed data (example)
        print("Doing predictions")
        FORECAST_FACTOR = 3 if notes else 2
        out_rows = []
        for row in rows:
            forecast = float(row["forecast"]) * FORECAST_FACTOR
            out_rows.append([
                row["sku_id"],
                row["facility_id"],
                row["product_category"],
                row["chain"],
                row["region"],
                forecast,
            ])
        await update_job(0.6)

        # Create a CSV file with the forecast results
        print("Creating the output CSV file")
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["sku_id", "facility_id", "product_category", "chain", "region", "forecast"]
        )
        writer.writerows(out_rows)
        await update_job(0.8)

        # Upload the forecast results to Supabase storage
        target_name = f"uploads/forecasts/{job_id}"
        print(f"Uploading the forecast results to `{target_name}`")
        file_content = output.getvalue().encode("utf-8")
        db.storage.from_("uploads").upload(target_name, file_content)
        await update_job(0.95)

        # Update the entry in the forecasts table
        print("Updating the forecast entry")
        db.table("forecasts").update({"file_id": target_name}).eq(
            "id", forecast_id
        ).execute()
        await update_job(1.0)
        print("Done")

    except Exception as e:
        # Update the job status to failed
        db.table("jobs").update({"status": "failed", "error": str(e)}).eq(
            "id", job_id
        ).execute()
