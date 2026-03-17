import type { TenantLeasesApiData } from "@/app/api/tenants/[id]/leases/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

export function useTenantLeases(tenantId: number | null, options?: SWRConfiguration<TenantLeasesApiData>) {
  const key = tenantId != null ? `/api/tenants/${tenantId}/leases` : null;

  const swr = useSWR<TenantLeasesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return swr;
}
