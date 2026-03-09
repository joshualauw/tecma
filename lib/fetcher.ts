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
