import type { AvailableUnitsApiData } from "@/app/api/units/available/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseAvailableUnitsParams = {
  propertyId: string;
};

export function useAvailableUnits(
  { propertyId }: UseAvailableUnitsParams,
  options?: SWRConfiguration<AvailableUnitsApiData>,
) {
  const propertyIdNum = Number(propertyId);
  const isEnabled = Number.isInteger(propertyIdNum) && propertyIdNum > 0;

  const params = new URLSearchParams();
  if (isEnabled) {
    params.set("propertyId", String(propertyIdNum));
  }

  const key = isEnabled ? `/api/units/available?${params.toString()}` : null;

  return useSWR<AvailableUnitsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
