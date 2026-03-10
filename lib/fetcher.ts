import type { ApiResponse } from "@/types/ApiResponse";

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { method: "GET", ...init });

  if (!response.ok) {
    throw new Error("Failed to fetch");
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }
  if (payload.data == null) {
    throw new Error(payload.message ?? "No data returned");
  }

  return payload.data;
}

export async function mutator<TResponse, TArg = TResponse>(
  url: string,
  { arg }: { arg: TArg },
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify(arg),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new Error("Failed to mutate");
  }

  const payload = (await response.json()) as ApiResponse<TResponse>;

  if (!payload.success) {
    throw new Error(payload.message ?? "Request failed");
  }
  if (payload.data == null) {
    throw new Error(payload.message ?? "No data returned");
  }

  return payload.data;
}
