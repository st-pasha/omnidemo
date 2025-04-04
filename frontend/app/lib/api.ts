import type { ZodSchema } from "zod";
import { useCurrentUserA } from "~/state/current-user";

class HTTPError extends Error {}

class Api {
  private _prefix: string;

  constructor() {
    this._prefix = import.meta.env.VITE_API_URL || "http://localhost:8000/";
    console.log("API prefix URL: ", this._prefix);
    if (this._prefix.endsWith("/")) {
      this._prefix = this._prefix.slice(0, -1);
    }
    if (!this._prefix) {
      console.error("API prefix URL is not set");
    }
  }

  async get(
    endpoint: string,
    searchParams?: Record<string, any>,
  ): Promise<ApiResponse> {
    const url = this.makeUrl(endpoint, searchParams);
    console.log(`API request: GET ${url}`);
    const request = new Request(url, { method: "GET" });
    return this._fetchRequest(request);
  }

  async post(endpoint: string, body?: object): Promise<ApiResponse> {
    const url = this.makeUrl(endpoint);
    console.log(`API request: POST ${url}, body:`, body);
    const init: RequestInit = { method: "POST" };
    if (body instanceof FormData) {
      // init.headers = { "Content-Type": "multipart/form-data" };
      init.body = body;
    } else {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const request = new Request(url, init);
    return this._fetchRequest(request);
  }

  private async _fetchRequest(request: Request): Promise<ApiResponse> {
    const user = await useCurrentUserA();
    if (user.authKey) {
      request.headers.set("Authorization", `Bearer ${user.authKey}`);
    }
    const response = await fetch(request);

    if (!response.ok) {
      console.error("API error: ", response);
      let json = null;
      try {
        json = await response.json();
        console.error("Response body: ", json);
      } catch (e) {}
      if (json !== null && typeof json === "object") {
        const error = (json as { detail?: string }).detail;
        if (error) {
          throw new HTTPError(JSON.stringify(error));
        }
      }
      throw new HTTPError(response.statusText);
    }
    return new ApiResponse(response);
  }

  makeUrl(endpoint: string, searchParams?: Record<string, string>) {
    const url = new URL("/api" + endpoint, this._prefix);
    if (searchParams) {
      url.search = new URLSearchParams(searchParams).toString();
    }
    return url.toString();
  }
}

class ApiResponse {
  private _response: Response;

  constructor(response: Response) {
    this._response = response;
  }

  async json<T = unknown>(schema?: ZodSchema<T>): Promise<T> {
    const data = await this._response.json();
    console.log("API response data: ", data);
    if (schema) {
      return schema.parse(data);
    }
    return data;
  }

  text(): Promise<string> {
    return this._response.text();
  }

  async *stream<T = string>(schema?: ZodSchema<T>): AsyncGenerator<T> {
    if (!this._response.body) {
      throw new Error("Response body is not readable");
    }
    const reader = this._response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line) continue;
        if (schema) {
          const json = JSON.parse(line);
          const row = schema.parse(json);
          yield row;
        } else {
          yield line as unknown as T;
        }
      }
    }
  }
}

export const api = new Api();

export { ApiResponse, HTTPError };
