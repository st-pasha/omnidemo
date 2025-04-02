import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { api } from "~/lib/api";
import { useCurrentUser } from "./current-user";

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

  constructor(data: TUserChart) {
    this.chartKey = data.chart_key;
    makeAutoObservable(this);
    this._fetchData();
  }

  get isLoading(): boolean {
    return this._dataLoading;
  }

  async _fetchData() {
    const response = await api.get("/forecasts/get-chart", {
      key: this.chartKey,
      forecast_id: "",
    });
    const data = await response.json(ZGetChartResponse);
    runInAction(() => {
      this._dataLoading = false;
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
  forecast_id: z.string(),
  data: z.any(),
});
type TChart = z.infer<typeof ZChart>;

const ZListChartsResponse = z.object({
  charts: z.array(ZUserChart),
});

const ZGetChartResponse = z.object({
  chart: ZChart,
});

const chartsStore = new ChartsStore();
export { chartsStore, type TUserChart };
