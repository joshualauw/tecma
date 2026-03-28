import type { RoomsApiData } from "@/app/api/rooms/route";
import type { RoomStatus } from "@/generated/prisma/enums";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseRoomsParams = {
  propertyId: string;
  status: "all" | RoomStatus;
};

export function useRooms({ propertyId, status }: UseRoomsParams, options?: SWRConfiguration<RoomsApiData>) {
  const params = new URLSearchParams();

  if (propertyId !== "all") {
    params.set("propertyId", propertyId);
  }

  if (status !== "all") {
    params.set("status", status);
  }

  const queryString = params.toString();
  const key = `/api/rooms${queryString ? `?${queryString}` : ""}`;

  return useSWR<RoomsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    revalidateOnFocus: false,
    ...options,
  });
}
