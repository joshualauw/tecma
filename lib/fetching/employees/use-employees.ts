import type { EmployeesApiData } from "@/app/api/employees/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseEmployeesParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
  propertyId: string;
  role: string;
};

export function useEmployees(
  { pageIndex, pageSize, search, propertyId, role }: UseEmployeesParams,
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
  if (propertyId !== "all") {
    params.set("propertyId", propertyId);
  }
  if (role !== "all") {
    params.set("role", role);
  }
  const key = `/api/employees?${params.toString()}`;

  const swr = useSWR<EmployeesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return swr;
}
