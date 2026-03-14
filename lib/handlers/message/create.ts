import { MessageApiItem } from "@/app/api/messages/route";
import { MessageType, SenderType } from "@/generated/prisma/enums";
import { MessagesCreateInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import dayjs from "@/lib/dayjs";
import { MessageExtras } from "@/types/MessageExtras";

type MessageToCreate = {
  roomId: number;
  propertyId: number;
  content: string;
  messageType: MessageType;
};

function enrichMessageToDatabase(message: MessageToCreate): MessagesCreateInput {
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
      break;
    }
    default: {
      throw new Error(`Unsupported message type: ${message.messageType}`);
    }
  }

  return baseMessage;
}

export async function handleWhatsappMessageCreate(message: MessageToCreate): Promise<MessageApiItem> {
  const databaseMessage = enrichMessageToDatabase(message);
  const now = dayjs();

  return await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.messages.create({
      data: databaseMessage,
      select: {
        id: true,
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
        lastMessage: message.content,
        lastMessageAt: now.toDate(),
      },
    });

    return {
      ...createdMessage,
      extras: createdMessage.extras as MessageExtras | null,
    };
  });
}
