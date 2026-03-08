import type { PropertiesApiData } from "@/app/api/properties/route";
import { fetcher } from "@/lib/fetcher";
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

  const swr = useSWR<PropertiesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: 3,
    ...options,
  });

  return swr;
}
