import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { api } from "~/lib/api";
import { useCurrentUser } from "~/state/current-user";

class InsightsStore {
  private _insights: TInsight[] | null;

  constructor() {
    this._insights = null;
    makeAutoObservable(this);
  }

  get insights(): TInsight[] {
    if (!this._insights) this._fetchInsights();
    return this._insights ?? [];
  }

  sendMessage = async (message: string): Promise<void> => {
    const response = await api.post("/insights/send-message", {
      message,
      username: useCurrentUser().username,
    });
    const data = await response.json(ZSendMessageResponse);
    if (!this._insights) this._insights = [];
    this._insights.push(data.insight);
  };

  async _fetchInsights(): Promise<void> {
    const response = await api.get("/insights/list-insights");
    const data = await response.json(ZListInsightsResponse);
    runInAction(() => {
      this._insights = data.insights;
    });
  }
}

const ZInsight = z.object({
  id: z.number(),
  message: z.string(),
  created_at: z.string(),
  username: z.string(),
});
type TInsight = z.infer<typeof ZInsight>;

const ZListInsightsResponse = z.object({
  insights: z.array(ZInsight),
});

const ZSendMessageResponse = z.object({
  insight: ZInsight,
});

const insightsStore = new InsightsStore();
export { insightsStore };
