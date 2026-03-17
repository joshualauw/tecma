import type { EmployeesApiData } from "@/app/api/employees/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseEmployeesParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
  roleId: string;
};

export function useEmployees(
  { pageIndex, pageSize, search, roleId }: UseEmployeesParams,
  options?: SWRConfiguration<EmployeesApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  if (roleId !== "all") {
    params.set("roleId", roleId);
  }
  const key = `/api/employees?${params.toString()}`;

  const swr = useSWR<EmployeesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return swr;
}
