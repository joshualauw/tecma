import type { TenantsApiData } from "@/app/api/tenants/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseTenantsParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
  propertyId: string;
};

export function useTenants(
  { pageIndex, pageSize, search, propertyId }: UseTenantsParams,
  options?: SWRConfiguration<TenantsApiData>,
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
  const key = `/api/tenants?${params.toString()}`;

  return useSWR<TenantsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
