import type { AvailableUnitsApiData } from "@/app/api/units/available/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseAvailableUnitsParams = {
  propertyId: string;
  /** When editing a tenant, pass their current unit id so that unit is included in the list. */
  unitIdToInclude?: number | null;
};

export function useAvailableUnits(
  { propertyId, unitIdToInclude }: UseAvailableUnitsParams,
  options?: SWRConfiguration<AvailableUnitsApiData>,
) {
  const propertyIdNum = Number(propertyId);
  const isEnabled =
    Number.isInteger(propertyIdNum) && propertyIdNum > 0;

  const params = new URLSearchParams();
  if (isEnabled) {
    params.set("propertyId", String(propertyIdNum));
    if (unitIdToInclude != null && Number.isInteger(unitIdToInclude) && unitIdToInclude > 0) {
      params.set("tenantId", String(unitIdToInclude));
    }
  }

  const key = isEnabled ? `/api/units/available?${params.toString()}` : null;

  const swr = useSWR<AvailableUnitsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return {
    ...swr,
    units: swr.data?.units ?? [],
    isLoading: isEnabled && swr.isLoading,
  };
}
