import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { ZGetJobResponse, ZJob, type TJob } from "./inputs-store";
import { api } from "~/lib/api";

class ForecastsStore {
  private _forecast: TForecast | null;
  private _job: TJob | null = null;
  private _loading: boolean = true;
  private _timer: NodeJS.Timeout | null = null;

  constructor() {
    this._forecast = null;
    makeAutoObservable(this);
  }

  get loading(): boolean {
    return this._loading;
  }

  get forecast(): TForecast | null {
    if (!this._forecast) this._fetchForecast();
    return this._forecast;
  }

  get job(): TJob | null {
    return this._job;
  }

  async startForecast(): Promise<void> {
    const response = await api.post("/forecasts/start-forecast");
    const data = await response.json(ZStartForecastResponse);
    runInAction(() => {
      this._forecast = data.forecast;
      this._job = data.job;
      this._pollForecastJob();
    });
  }

  async publishForecast(): Promise<void> {
    const response = await api.post("/forecasts/publish-forecast", {
      id: this._forecast?.id,
    });
    const data = await response.json(ZPublishForecastResponse);
    runInAction(() => {
      this._forecast = data.forecast;
    });
  }

  async _fetchForecast(): Promise<void> {
    const response = await api.get("/forecasts/get-latest-forecast");
    const data = await response.json(ZGetLatestForecastResponse);
    runInAction(() => {
      this._forecast = data.forecast;
      this._job = data.job;
      this._loading = false;
      this._pollForecastJob();
    });
  }

  private _pollForecastJob() {
    if (this._timer) clearInterval(this._timer);
    if (!this._job) return;
    if (this._job.status !== "running") return;
    const jobId = this._job.id;

    this._timer = setInterval(async () => {
      const response = await api.get("/jobs/get-job", { id: jobId });
      const data = await response.json(ZGetJobResponse);
      runInAction(() => {
        this._job = data.job;
        if (data.job.status !== "running") {
          clearInterval(this._timer!);
          this._timer = null;
          // Retrieve the file id
          this._fetchForecast();
        }
      });
    }, 1000);
  }
}

const ZForecast = z.object({
  id: z.number(),
  file_id: z.string().nullable(),
  job_id: z.string().nullable(),
  status: z.enum(["draft", "published"]),
  created_at: z.string(),
});
type TForecast = z.infer<typeof ZForecast>;

const ZGetLatestForecastResponse = z.object({
  forecast: ZForecast.nullable(),
  job: ZJob.nullable(),
});

const ZStartForecastResponse = z.object({
  forecast: ZForecast,
  job: ZJob,
});

const ZPublishForecastResponse = z.object({
  forecast: ZForecast,
});

const forecastStore = new ForecastsStore();
export { forecastStore };
