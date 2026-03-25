import type { LeanTenantsApiData } from "@/app/api/tenants/lean/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseLeanTenantsParams = {
  propertyId: string;
};

export function useLeanTenants(
  { propertyId }: UseLeanTenantsParams,
  options?: SWRConfiguration<LeanTenantsApiData>,
) {
  const propertyIdNum = Number(propertyId);
  const isEnabled = Number.isInteger(propertyIdNum) && propertyIdNum > 0;

  const params = new URLSearchParams();
  if (isEnabled) {
    params.set("propertyId", String(propertyIdNum));
  }

  const key = isEnabled ? `/api/tenants/lean?${params.toString()}` : null;

  return useSWR<LeanTenantsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
