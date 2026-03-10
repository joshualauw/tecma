import type { MessageApiItem } from "@/app/api/messages/route";
import { mutator } from "@/lib/fetcher";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

type UseSendMessagePayload = {
  roomId: number;
  propertyId: number;
  content: string;
};

export function useSendMessage(options?: SWRMutationConfiguration<MessageApiItem, UseSendMessagePayload, string>) {
  const key = `/api/messages/send`;

  const swr = useSWRMutation(key, mutator<MessageApiItem, UseSendMessagePayload>, {
    ...options,
  });

  return swr;
}
