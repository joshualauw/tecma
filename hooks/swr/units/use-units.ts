import type { UnitsApiData } from "@/app/api/units/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseUnitsParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
  propertyId: string;
};

export function useUnits(
  { pageIndex, pageSize, search, propertyId }: UseUnitsParams,
  options?: SWRConfiguration<UnitsApiData>,
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
  const key = `/api/units?${params.toString()}`;

  return useSWR<UnitsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
