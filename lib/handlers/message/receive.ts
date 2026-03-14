import type {
  WebhookImageMessage,
  WebhookStickerMessage,
  WebhookTextMessage,
  WebhookDocumentMessage,
  WebhookValue,
  WebhookAudioMessage,
  WebhookVideoMessage,
  WebhookMessageBase,
} from "@whatsapp-cloudapi/types/webhook";
import { MessageStatus, MessageType, RoomStatus, SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import type { MessageExtras } from "@/types/MessageExtras";
import { InputJsonValue } from "@prisma/client/runtime/client";
import { uploadFileToR2 } from "@/lib/upload";

type WebhookMessage = NonNullable<WebhookValue["messages"]>[number];
type ExtendedWebhookMessageType = WebhookMessage["type"] | "location";
type WebhookLocationMessage = WebhookMessageBase & {
  type: ExtendedWebhookMessageType;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
    url?: string;
  };
};

type FlattenedMessage = {
  waId: string;
  content: string;
  messageType: MessageType;
  extras: MessageExtras | null;
};

async function resolveMediaUrl(mediaId: string): Promise<string> {
  const token = process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN;

  const metadataResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metadata = await metadataResponse.json();

  if (!metadata.url) {
    throw new Error("Failed to retrieve media URL from Meta");
  }

  const fileResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const arrayBuffer = await fileResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = metadata.mime_type || fileResponse.headers.get("content-type") || "application/octet-stream";

  return await uploadFileToR2(buffer, contentType);
}

async function flattenWebhookMessage(msg: WebhookMessage): Promise<FlattenedMessage> {
  const waId = msg.id;
  const type = msg.type as ExtendedWebhookMessageType;

  let messageType: MessageType = MessageType.text;
  let content: string = "";
  let extras: MessageExtras | null = null;

  switch (type) {
    case "text": {
      messageType = MessageType.text;
      content = (msg as WebhookTextMessage).text.body;
      break;
    }
    case "image": {
      messageType = MessageType.image;
      content = (msg as WebhookImageMessage).image.caption || "";
      extras = {
        image: {
          mediaId: (msg as WebhookImageMessage).image.id,
          mediaUrl: await resolveMediaUrl((msg as WebhookImageMessage).image.id),
          type: "image",
        },
      };
      break;
    }
    case "sticker": {
      messageType = MessageType.image;
      content = "";
      extras = {
        image: {
          mediaId: (msg as WebhookStickerMessage).sticker.id,
          mediaUrl: await resolveMediaUrl((msg as WebhookStickerMessage).sticker.id),
          type: "sticker",
        },
      };
      break;
    }
    case "document": {
      messageType = MessageType.document;
      content = (msg as WebhookDocumentMessage).document.caption || "";
      extras = {
        document: {
          mediaId: (msg as WebhookDocumentMessage).document.id,
          mediaUrl: await resolveMediaUrl((msg as WebhookDocumentMessage).document.id),
          filename: (msg as WebhookDocumentMessage).document.filename,
        },
      };
      break;
    }
    case "audio": {
      messageType = MessageType.audio;
      content = "";
      extras = {
        audio: {
          mediaId: (msg as WebhookAudioMessage).audio.id,
          mediaUrl: await resolveMediaUrl((msg as WebhookAudioMessage).audio.id),
        },
      };
      break;
    }
    case "video": {
      messageType = MessageType.video;
      content = (msg as WebhookVideoMessage).video.caption || "";
      extras = {
        video: {
          mediaId: (msg as WebhookVideoMessage).video.id,
          mediaUrl: await resolveMediaUrl((msg as WebhookVideoMessage).video.id),
        },
      };
      break;
    }
    case "location": {
      messageType = MessageType.location;
      content = "";
      extras = {
        location: {
          latitude: (msg as WebhookLocationMessage).location.latitude,
          longitude: (msg as WebhookLocationMessage).location.longitude,
          address: (msg as WebhookLocationMessage).location.address,
          name: (msg as WebhookLocationMessage).location.name,
          url: (msg as WebhookLocationMessage).location.url,
        },
      };
      break;
    }
    default: {
      messageType = MessageType.text;
      content = "[unsupported]";
      break;
    }
  }

  return { waId, content, extras, messageType: messageType as MessageType };
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

  const messageTimestamp = dayjs(Number(message.timestamp) * 1000);
  const expiredAt = messageTimestamp.add(1, "day");

  const flattenedMessage = await flattenWebhookMessage(message);
  const lastMessage = flattenedMessage.content !== "" ? flattenedMessage.content : `[${flattenedMessage.messageType}]`;

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
          lastMessage: lastMessage,
          lastMessageAt: messageTimestamp.toDate(),
          expiredAt: expiredAt.toDate(),
        },
        select: { id: true },
      });
    } else {
      await tx.rooms.update({
        where: { id: room.id },
        data: {
          lastMessage: lastMessage,
          lastMessageAt: messageTimestamp.toDate(),
          expiredAt: expiredAt.toDate(),
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
        extras: flattenedMessage.extras as InputJsonValue,
        status: MessageStatus.delivered,
        createdAt: messageTimestamp.toDate(),
      },
    });
  });
}
