import type { LeanEmployeesApiData } from "@/app/api/employees/lean/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseLeanEmployeesParams = {
  propertyId: string;
  role?: string | null;
};

export function useLeanEmployees(
  { propertyId, role }: UseLeanEmployeesParams,
  options?: SWRConfiguration<LeanEmployeesApiData>,
) {
  const propertyIdNum = Number(propertyId);
  const isEnabled = Number.isInteger(propertyIdNum) && propertyIdNum > 0;

  const params = new URLSearchParams();
  if (isEnabled) {
    params.set("propertyId", String(propertyIdNum));
  }
  if (role != null && role !== "") {
    params.set("role", role);
  }

  const key = isEnabled ? `/api/employees/lean?${params.toString()}` : null;

  const swr = useSWR<LeanEmployeesApiData>(key, fetcher, {
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
