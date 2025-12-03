import { toast } from "@/components/ui/sonner";

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

if (!BACKEND_BASE && typeof window !== "undefined") {
  // This will surface clearly in the browser console if the env var is missing.
  // We intentionally do not fall back to a guessed URL to avoid subtle bugs
  // with Next.js rewrites and API route conflicts.
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_BACKEND_URL is not set. ConceptPulse backend requests will fail until it is configured.",
  );
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!BACKEND_BASE) return normalizedPath; // best-effort fallback for local dev
  return `${BACKEND_BASE}/api/v1${normalizedPath}`;
}

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number | null;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<ApiResult<T>> {
  const { auth = true, headers, body, ...rest } = options;

  const url = buildUrl(path);

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> || {}),
  };

  if (!(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      (finalHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...rest,
      headers: finalHeaders,
      body: body instanceof FormData ? body : body,
    });

    const status = response.status;
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = (isJson ? await response.json() : await response.text()) as T;

    if (!response.ok) {
      const message = (data as any)?.detail || (data as any)?.error || response.statusText;
      toast(message || "Something went wrong while talking to the ConceptPulse backend.");
      return { data: null, error: message || "Request failed", status };
    }

    return { data, error: null, status };
  } catch (err: any) {
    const message = err?.message || "Network error";
    toast(message);
    return { data: null, error: message, status: null };
  }
}
