import { MessageStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import pusher from "@/lib/pusher";
import { WebhookStatus, WebhookValue } from "@whatsapp-cloudapi/types/webhook";

export type MessageStatusUpdate = {
  messageId: number;
  waId: string;
  messageStatus: MessageStatus;
};

function mapStatusToMessageStatus(status: WebhookStatus["status"] | "failed"): MessageStatus {
  switch (status) {
    case "sent":
      return MessageStatus.sent;
    case "delivered":
      return MessageStatus.delivered;
    case "read":
      return MessageStatus.read;
    case "failed":
      return MessageStatus.failed;
    default:
      throw new Error(`Unsupported status: ${status}`);
  }
}

export async function handleWhatsappMessageStatus(body: WebhookValue): Promise<void> {
  const statuses = body.statuses;
  const status = statuses![0];
  const messageStatus = mapStatusToMessageStatus(status.status);

  const updatedMessage = await prisma.messages.update({
    where: {
      waId: status.id,
    },
    select: {
      id: true,
      roomId: true,
    },
    data: {
      status: messageStatus,
    },
  });

  await pusher.trigger(`room-${updatedMessage.roomId}`, "new-message-status", {
    messageId: updatedMessage.id,
    waId: status.id,
    messageStatus,
  } as MessageStatusUpdate);
}
