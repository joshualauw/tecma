import { MessageApiItem } from "@/app/api/messages/route";
import { MessageStatus } from "@/generated/prisma/enums";

export interface UpdateMessageStatusNotification {
  messageId: number;
  waId: string;
  messageStatus: MessageStatus;
}

export type NewMessageNotification = MessageApiItem;
