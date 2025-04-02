import { makeAutoObservable, runInAction } from "mobx";
import { z } from "zod";
import { api, ApiResponse } from "~/lib/api";
import { useCurrentUser } from "./current-user";

class InputsStore {
  private _inputs: TInput[] | null;
  private _filesInProgress: FileInProgress[] = [];
  private _loading: boolean = true;

  constructor() {
    this._inputs = null;
    makeAutoObservable(this);
  }

  get loading(): boolean {
    return this._loading;
  }

  get inputs(): TInput[] {
    if (!this._inputs) this._fetchInputs();
    return this._inputs ?? [];
  }

  get filesInProgress(): FileInProgress[] {
    return this._filesInProgress;
  }

  async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    const jobId = crypto.randomUUID();
    formData.append("file", file);
    formData.append("username", useCurrentUser().username ?? "");
    formData.append("job_id", jobId);

    const response = await api.post("/inputs/upload-file", formData);
    const fip = new FileInProgress(file.name, jobId, response);
    runInAction(() => {
      this._filesInProgress = [...this._filesInProgress, fip];
    });
  }

  async _fetchInputs(): Promise<void> {
    const response = await api.get("/inputs/list-inputs");
    const data = await response.json(ZListInputsResponse);
    runInAction(() => {
      this._inputs = data.inputs;
      this._loading = false;
    });
  }

  _removeFileInProgress(fip: FileInProgress): void {
    this._filesInProgress = this._filesInProgress.filter((file) => file !== fip);
    this._inputs = [
      ...this._inputs!,
      {
        id: fip.fileId,
        file_name: fip.fileName,
        username: useCurrentUser().username ?? "",
        size: fip.fileSize,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

// Probably this can be just a regular TInput object,
// without a separate category
class FileInProgress {
  private _response: ApiResponse;
  private _jobId: string;
  private _timer: NodeJS.Timeout | null = null;
  fileName: string;
  fileSize: number;
  fileId: string;
  progress: number;

  constructor(fileName: string, jobId: string, response: ApiResponse) {
    this._response = response;
    this._jobId = jobId;
    this.fileSize = 0;
    this.fileName = fileName;
    this.fileId = "";
    this.progress = 0;
    makeAutoObservable(this);
    this._waitForResponse();
    this._timer = setInterval(() => {
      this._fetchJobStatus();
    }, 1000);
  }

  private async _waitForResponse(): Promise<void> {
    const response = await this._response.json(ZUploadFileResponse);
    runInAction(() => {
      this.fileId = response.file_id;
      this.fileSize = response.file_size;
      this._finish();
    });
  }

  private async _fetchJobStatus(): Promise<void> {
    const response = await api.get("/jobs/get-job", { id: this._jobId });
    const data = await response.json(ZGetJobResponse);
    runInAction(() => {
      this.progress = data.job.progress;
      if (data.job.status === "completed") {
        this._finish();
      }
    });
  }

  private _finish() {
    runInAction(() => {
      this.progress = 1;
      inputsStore._removeFileInProgress(this);
      this._timer && clearInterval(this._timer);
    });
  }
}

const ZInput = z.object({
  id: z.string(),
  file_name: z.string(),
  username: z.string(),
  size: z.number(),
  created_at: z.string(),
});
type TInput = z.infer<typeof ZInput>;

const ZJob = z.object({
  id: z.string(),
  progress: z.number(),
  status: z.enum(["completed", "running", "failed"]),
  error: z.string().nullable().optional(),
  created_at: z.string(),
});
type TJob = z.infer<typeof ZJob>;

const ZListInputsResponse = z.object({
  inputs: z.array(ZInput),
});

const ZUploadFileResponse = z.object({
  file_id: z.string(),
  file_size: z.number().int(),
});

const ZGetJobResponse = z.object({
  job: ZJob,
});

const inputsStore = new InputsStore();
export {
  inputsStore,
  ZGetJobResponse,
  ZJob,
  type FileInProgress,
  type TInput,
  type TJob,
};
