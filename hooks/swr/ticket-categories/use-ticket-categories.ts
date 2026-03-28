import type { TicketCategoriesApiData } from "@/app/api/tickets/categories/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseTicketCategoriesParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
};

export function useTicketCategories(
  { pageIndex, pageSize, search }: UseTicketCategoriesParams,
  options?: SWRConfiguration<TicketCategoriesApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  const key = `/api/tickets/categories?${params.toString()}`;

  return useSWR<TicketCategoriesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
