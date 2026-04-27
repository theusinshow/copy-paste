import { buildApiUrl } from "@/lib/api/config";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NETWORK_RETRY_ATTEMPTS = 3;
const NETWORK_RETRY_DELAY_MS = 5000;

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!isFormData && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = buildApiUrl(path);
  const requestInit = { ...init, headers };

  let lastNetworkError: unknown;
  for (let attempt = 0; attempt < NETWORK_RETRY_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
    }
    try {
      const response = await fetch(url, requestInit);
      const payload = await readResponsePayload(response);
      if (!response.ok) {
        throw new ApiError(
          response.status,
          payload,
          getPayloadMessage(payload, response.statusText),
        );
      }
      return payload as T;
    } catch (error) {
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }

  throw new ApiError(
    0,
    null,
    "O servidor esta iniciando. Aguarde alguns segundos e tente novamente.",
  );
}

export function extractApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

function getPayloadMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  return fallback;
}
