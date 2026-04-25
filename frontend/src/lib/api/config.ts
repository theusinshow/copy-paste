const DEFAULT_DEV_API_URL = "http://127.0.0.1:8000";

function resolveApiBaseUrl() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_API_URL;
  }

  throw new Error(
    "NEXT_PUBLIC_API_URL is required in production deployments.",
  );
}

export const API_BASE_URL = resolveApiBaseUrl();

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
