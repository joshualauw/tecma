import type { EmployeePermissionsApiData } from "@/app/api/employees/[id]/permissions/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

export function useEmployeePermissions(
  employeeId: number | null,
  options?: SWRConfiguration<EmployeePermissionsApiData>,
) {
  const key = employeeId != null ? `/api/employees/${employeeId}/permissions` : null;

  return useSWR<EmployeePermissionsApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
