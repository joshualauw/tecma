import type { RolesApiData } from "@/app/api/roles/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseRolesParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
};

export function useRoles({ pageIndex, pageSize, search }: UseRolesParams, options?: SWRConfiguration<RolesApiData>) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  const key = `/api/roles?${params.toString()}`;

  const swr = useSWR<RolesApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });

  return swr;
}

