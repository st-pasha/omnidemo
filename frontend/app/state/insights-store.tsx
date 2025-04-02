import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { api } from "~/lib/api";
import { useCurrentUser } from "~/state/current-user";

class InsightsStore {
  private _insights: TInsight[] | null;
  private _loading: boolean = true;

  constructor() {
    this._insights = null;
    makeAutoObservable(this);
  }

  get loading(): boolean {
    return this._loading;
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

  updateMessage = async (id: number, message: string): Promise<void> => {
    const response = await api.post("/insights/update-message", {
      message_id: id,
      message,
      username: useCurrentUser().username,
    });
    const data = await response.json(ZUpdateMessageResponse);
    const index = this._insights!.findIndex((i) => i.id === id);
    if (index !== -1) {
      this._insights![index] = data.insight;
    }
  };

  async _fetchInsights(): Promise<void> {
    const response = await api.get("/insights/list-insights");
    const data = await response.json(ZListInsightsResponse);
    runInAction(() => {
      this._insights = data.insights.sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      this._loading = false;
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
const ZUpdateMessageResponse = z.object({
  insight: ZInsight,
});

const insightsStore = new InsightsStore();
export { insightsStore, type TInsight };
