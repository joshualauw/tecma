import type { WhatsappApiData } from "@/app/api/whatsapp/route";
import { fetcher } from "@/lib/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseWhatsappParams = {
  pageIndex: number;
  pageSize: number;
  search: string;
};

export function useWhatsapp(
  { pageIndex, pageSize, search }: UseWhatsappParams,
  options?: SWRConfiguration<WhatsappApiData>,
) {
  const params = new URLSearchParams({
    page: String(pageIndex),
    size: String(pageSize),
  });
  const searchValue = search.trim();
  if (searchValue) {
    params.set("search", searchValue);
  }
  const key = `/api/whatsapp?${params.toString()}`;

  const swr = useSWR<WhatsappApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: 3,
    ...options,
  });

  return swr;
}
