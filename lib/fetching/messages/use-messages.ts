import type { MessagesApiData } from "@/app/api/messages/route";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

export function useMessages(roomId: number | null, options?: SWRConfiguration<MessagesApiData>) {
  const key = roomId === null ? null : `/api/messages?roomId=${roomId}`;

  return useSWR<MessagesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: 3,
    ...options,
  });
}
