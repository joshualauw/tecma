import { MessageApiItem } from "@/app/api/messages/route";
import { MessageType, SenderType } from "@/generated/prisma/enums";
import { MessagesCreateInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { MessageExtras } from "@/types/MessageExtras";
import { uploadFileToR2 } from "@/lib/upload";

type MessageToCreate = {
  roomId: number;
  propertyId: number;
  content: string;
  messageType: MessageType;
  file: File | null;
  filename: string | null;
};

async function resolveMediaUrl(message: MessageToCreate): Promise<string> {
  if (!message.file) {
    throw new Error("File is required");
  }

  const file = message.file;
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return await uploadFileToR2(buffer, fileType);
}

async function enrichMessageToDatabase(message: MessageToCreate): Promise<MessagesCreateInput> {
  const baseMessage: MessagesCreateInput = {
    room: {
      connect: {
        id: message.roomId,
      },
    },
    property: {
      connect: {
        id: message.propertyId,
      },
    },
    senderType: SenderType.user,
    content: message.content,
    messageType: message.messageType,
  };

  switch (message.messageType) {
    case MessageType.text: {
      baseMessage.content = message.content;
      baseMessage.messageType = MessageType.text;
      break;
    }
    case MessageType.image: {
      baseMessage.content = message.content;
      baseMessage.messageType = MessageType.image;
      baseMessage.extras = {
        image: {
          mediaUrl: await resolveMediaUrl(message),
          type: "image",
        },
      };
      break;
    }
    case MessageType.document: {
      baseMessage.content = message.content;
      baseMessage.messageType = MessageType.document;
      baseMessage.extras = {
        document: {
          mediaUrl: await resolveMediaUrl(message),
          type: "document",
          filename: message.filename ?? undefined,
        },
      };
      break;
    }
    case MessageType.video: {
      baseMessage.content = message.content;
      baseMessage.messageType = MessageType.video;
      baseMessage.extras = {
        video: {
          mediaUrl: await resolveMediaUrl(message),
          type: "video",
        },
      };
      break;
    }
    case MessageType.audio: {
      baseMessage.content = "";
      baseMessage.messageType = MessageType.audio;
      baseMessage.extras = {
        audio: {
          mediaUrl: await resolveMediaUrl(message),
          type: "audio",
        },
      };
      break;
    }
    default: {
      throw new Error(`Unsupported message type: ${message.messageType}`);
    }
  }

  return baseMessage;
}

export async function handleWhatsappMessageCreate(message: MessageToCreate): Promise<MessageApiItem> {
  const databaseMessage = await enrichMessageToDatabase(message);
  const now = dayjs();

  return await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.messages.create({
      data: databaseMessage,
      select: {
        id: true,
        roomId: true,
        senderType: true,
        content: true,
        status: true,
        messageType: true,
        createdAt: true,
        extras: true,
      },
    });

    await tx.rooms.update({
      where: { id: message.roomId },
      data: {
        lastMessage: message.content !== "" ? message.content : `[${message.messageType}]`,
        lastMessageAt: now.toDate(),
      },
    });

    return {
      ...createdMessage,
      extras: createdMessage.extras as MessageExtras | null,
    };
  });
}
