import type { WebhookValue } from "@whatsapp-cloudapi/types/webhook";
import { MessageStatus, MessageType, RoomStatus, SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import dayjs from "@/lib/dayjs";

type WebhookMessage = NonNullable<WebhookValue["messages"]>[number];

type FlattenedMessage = {
  waId: string;
  content: string;
  messageType: MessageType;
};

function flattenWebhookMessage(msg: WebhookMessage): FlattenedMessage {
  const waId = msg.id;
  const type = msg.type;

  let messageType: MessageType = MessageType.text;
  let content: string = "";

  switch (type) {
    case "text": {
      messageType = MessageType.text;
      content = msg.text.body;
      break;
    }
    case "image": {
      messageType = MessageType.image;
      content = "[image]";
      break;
    }
    case "document": {
      messageType = MessageType.document;
      content = "[document]";
      break;
    }
    case "audio": {
      messageType = MessageType.audio;
      content = "[audio]";
      break;
    }
    case "video": {
      messageType = MessageType.video;
      content = "[video]";
      break;
    }
    default: {
      messageType = MessageType.text;
      content = "[unsupported]";
      break;
    }
  }

  return { waId, content, messageType: messageType as MessageType };
}

export async function handleWhatsappMessageReceive(body: WebhookValue): Promise<void> {
  const messages = body.messages;
  const metadata = body.metadata;

  const phoneNumberId = metadata.phone_number_id;
  const message = messages![0];
  const fromWaId = message.from;

  const [whatsapp, tenant] = await Promise.all([
    prisma.whatsapp.findUnique({
      where: { phoneId: phoneNumberId },
      select: { id: true },
    }),
    prisma.tenants.findFirst({
      where: {
        OR: [{ phoneNumber: fromWaId }, { phoneNumber: `+${fromWaId}` }],
      },
      select: { id: true, propertyId: true },
    }),
  ]);

  if (!whatsapp) {
    throw new Error("WhatsApp not registered");
  }
  if (!tenant) {
    throw new Error("Tenant not registered");
  }

  const now = dayjs();
  const expiredAt = now.add(1, "day");

  const flattenedMessage = flattenWebhookMessage(message);

  await prisma.$transaction(async (tx) => {
    let room = await tx.rooms.findFirst({
      where: {
        tenantId: tenant.id,
        whatsappId: whatsapp.id,
        status: RoomStatus.active,
      },
      select: { id: true },
    });

    if (!room) {
      room = await tx.rooms.create({
        data: {
          propertyId: tenant.propertyId,
          tenantId: tenant.id,
          whatsappId: whatsapp.id,
          status: RoomStatus.active,
          expiredAt: expiredAt.toDate(),
          lastMessage: flattenedMessage.content,
          lastMessageAt: now.toDate(),
        },
        select: { id: true },
      });
    } else {
      await tx.rooms.update({
        where: { id: room.id },
        data: {
          lastMessage: flattenedMessage.content,
          lastMessageAt: now.toDate(),
          expiredAt: expiredAt.toDate(), //extend the room expiration date
        },
      });
    }

    await tx.messages.create({
      data: {
        propertyId: tenant.propertyId,
        roomId: room.id,
        waId: message.id,
        senderType: SenderType.tenant,
        content: flattenedMessage.content,
        messageType: flattenedMessage.messageType,
        status: MessageStatus.delivered,
      },
    });
  });
}
