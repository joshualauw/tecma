import type { TicketsApiData } from "@/app/api/tickets/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseTicketsParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
  propertyId: string;
  categoryId: string;
  status: string;
  priority: string;
};

export function useTickets(
  { pageIndex, pageSize, search, propertyId, categoryId, status, priority }: UseTicketsParams,
  options?: SWRConfiguration<TicketsApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  if (propertyId !== "all") {
    params.set("propertyId", propertyId);
  }
  if (categoryId !== "all") {
    params.set("categoryId", categoryId);
  }
  if (status !== "all") {
    params.set("status", status);
  }
  if (priority !== "all") {
    params.set("priority", priority);
  }
  const key = `/api/tickets?${params.toString()}`;

  return useSWR<TicketsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
