import type { AvailableEmployeesApiData } from "@/app/api/employees/available/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseLeanEmployeesParams = {
  propertyId: string;
};

export function useAvailableEmployees(
  { propertyId }: UseLeanEmployeesParams,
  options?: SWRConfiguration<AvailableEmployeesApiData>,
) {
  const propertyIdNum = Number(propertyId);
  const isEnabled = Number.isInteger(propertyIdNum) && propertyIdNum > 0;

  const params = new URLSearchParams();
  if (isEnabled) {
    params.set("propertyId", String(propertyIdNum));
  }

  const key = isEnabled ? `/api/employees/available?${params.toString()}` : null;

  const swr = useSWR<AvailableEmployeesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return {
    ...swr,
    employees: swr.data?.employees ?? [],
    isLoading: isEnabled && swr.isLoading,
  };
}
