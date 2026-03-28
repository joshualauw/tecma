import type { NotificationsApiData } from "@/app/api/notifications/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseNotificationsParams = {
  pageIndex: number;
  pageSize: number;
};

export function useNotifications(
  { pageIndex, pageSize }: UseNotificationsParams,
  options?: SWRConfiguration<NotificationsApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const key = `/api/notifications?${params.toString()}`;

  return useSWR<NotificationsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    revalidateOnFocus: false,
    ...options,
  });
}

