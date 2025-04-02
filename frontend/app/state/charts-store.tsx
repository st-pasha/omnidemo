import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { api } from "~/lib/api";
import { useCurrentUser } from "./current-user";
import { forecastStore } from "./forecasts-store";

class ChartsStore {
  private _charts: Chart[] | null;
  private _loading: boolean = true;

  constructor() {
    this._charts = null;
    makeAutoObservable(this);
  }

  get loading(): boolean {
    return this._loading;
  }

  get charts(): Chart[] {
    if (!this._charts) this._fetchCharts();
    return this._charts ?? [];
  }

  async createChart(x: string, y: string, agg: string): Promise<void> {
    const key = `${x},${agg}/${y}`;
    const username = useCurrentUser().username;
    const response = await api.post("/forecasts/add-user-chart", {
      chart_key: key,
      username,
    });
    const data = await response.json(ZAddUserChartResponse);
    const chart = new Chart(data.chart);
    runInAction(() => {
      this._charts = [...(this._charts ?? []), chart];
    });
  }

  async _fetchCharts(): Promise<void> {
    const username = useCurrentUser().username;
    const response = await api.get("/forecasts/get-user-charts", { username });
    const data = await response.json(ZListChartsResponse);
    runInAction(() => {
      this._charts = data.charts.map((chart) => new Chart(chart));
      this._loading = false;
    });
  }
}

class Chart {
  private _dataLoading: boolean = true;
  chartKey: string;
  chartData: any;

  constructor(data: TUserChart) {
    this.chartKey = data.chart_key;
    this.chartData = null;
    makeAutoObservable(this);
    this._fetchData();
  }

  get isLoading(): boolean {
    return this._dataLoading;
  }

  async _fetchData() {
    const forecastId = forecastStore.forecast?.id;
    console.log("fetching chart data", forecastId, this.chartKey);
    if (!forecastId) return;
    const response = await api.get("/forecasts/get-chart", {
      chart_key: this.chartKey,
      forecast_id: forecastId,
    });
    const data = await response.json(ZGetChartResponse);
    runInAction(() => {
      this._dataLoading = false;
      this.chartData = data.chart.data;
    });
  }
}

const ZUserChart = z.object({
  id: z.number(),
  username: z.string(),
  chart_key: z.string(),
  created_at: z.string(),
});
type TUserChart = z.infer<typeof ZUserChart>;

const ZChart = z.object({
  id: z.number(),
  chart_key: z.string(),
  forecast_id: z.number().int(),
  data: z.any(),
});
type TChart = z.infer<typeof ZChart>;

const ZListChartsResponse = z.object({
  charts: z.array(ZUserChart),
});

const ZGetChartResponse = z.object({
  chart: ZChart,
});

const ZAddUserChartResponse = z.object({
  chart: ZUserChart,
});

const chartsStore = new ChartsStore();
export { chartsStore, type Chart, type TUserChart };
