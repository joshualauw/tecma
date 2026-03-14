import { MessageStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { WebhookStatus, WebhookValue } from "@whatsapp-cloudapi/types/webhook";

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

  await prisma.messages.update({
    where: {
      waId: status.id,
    },
    data: {
      status: mapStatusToMessageStatus(status.status),
    },
  });
}
