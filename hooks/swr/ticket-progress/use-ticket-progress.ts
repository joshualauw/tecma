import type { TicketProgressApiData } from "@/app/api/tickets/[id]/progress/route";
import { SWR_FETCH_RETRY_COUNT } from "@/lib/constants";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { type SWRConfiguration } from "swr";

type UseTicketProgressParams = {
  ticketId: number | null;
};

export function useTicketProgress(
  { ticketId }: UseTicketProgressParams,
  options?: SWRConfiguration<TicketProgressApiData>,
) {
  const ticketIdNum = Number(ticketId);
  const isEnabled = Number.isInteger(ticketIdNum) && ticketIdNum > 0;

  const key = isEnabled ? `/api/tickets/${ticketId}/progress` : null;

  return useSWR<TicketProgressApiData>(key, fetcher, {
    keepPreviousData: true,
    errorRetryCount: SWR_FETCH_RETRY_COUNT,
    ...options,
  });
}
