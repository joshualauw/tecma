import type { PropertiesApiData } from "@/app/api/properties/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UsePropertiesParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
};

export function useProperties(
  { pageIndex, pageSize, search }: UsePropertiesParams,
  options?: SWRConfiguration<PropertiesApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  const key = `/api/properties?${params.toString()}`;

  return useSWR<PropertiesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
