import type { RoomDetailApiItem } from "@/app/api/rooms/[id]/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

export function useRoomDetail(roomId: number | null, options?: SWRConfiguration<RoomDetailApiItem>) {
  const key = roomId === null ? null : `/api/rooms/${roomId}`;

  return useSWR<RoomDetailApiItem>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
