import type {
  CloudAPIMessageRequestBase,
  CloudAPISendTextMessageRequest,
  CloudAPIResponse,
  CloudAPISendImageMessageRequest,
  CloudAPISendDocumentMessageRequest,
  CloudAPISendVideoMessageRequest,
  CloudAPISendAudioMessageRequest,
} from "@whatsapp-cloudapi/types/cloudapi";
import { MessageStatus, MessageType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import axios from "axios";
import { MessageExtras } from "@/types/MessageExtras";
import { notifyNewSentMessage } from "@/lib/helpers/notification";
import { mapAuditUsers } from "@/lib/mappers/audit";

type MessageToSend = {
  id: number;
  tenantPhoneNumber: string;
  whatsappPhoneId: string;
};

type ExtendedCloudAPIMessageRequestBase = Omit<CloudAPIMessageRequestBase, "context"> & {
  context?: {
    message_id: string;
  };
};

type ExtendedCloudAPISendImageMessageRequest = Omit<CloudAPISendImageMessageRequest, "image"> & {
  image: {
    id?: string;
    caption?: string;
    link?: string;
  };
};

async function enrichMessageToCloudApi(message: MessageToSend, to: string): Promise<CloudAPIMessageRequestBase> {
  const databaseMessage = await prisma.messages.findUniqueOrThrow({
    where: { id: message.id },
  });

  const toE164 = to.startsWith("+") ? to : `+${to}`;

  const payload: ExtendedCloudAPIMessageRequestBase = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toE164,
  };

  if (databaseMessage.replyWaId) {
    payload.context = {
      message_id: databaseMessage.replyWaId,
    };
  }

  switch (databaseMessage.messageType) {
    case MessageType.text: {
      (payload as CloudAPISendTextMessageRequest).type = "text";
      (payload as CloudAPISendTextMessageRequest).text = {
        body: databaseMessage.content.slice(0, 4096),
      };
      break;
    }
    case MessageType.image: {
      (payload as CloudAPISendImageMessageRequest).type = "image";
      (payload as ExtendedCloudAPISendImageMessageRequest).image = {
        caption: databaseMessage.content,
        link: (databaseMessage.extras as MessageExtras).image?.mediaUrl as string,
      };
      break;
    }
    case MessageType.document: {
      (payload as CloudAPISendDocumentMessageRequest).type = "document";
      (payload as CloudAPISendDocumentMessageRequest).document = {
        caption: databaseMessage.content,
        link: (databaseMessage.extras as MessageExtras).document?.mediaUrl,
        filename: (databaseMessage.extras as MessageExtras).document?.filename,
      };
      break;
    }
    case MessageType.video: {
      (payload as CloudAPISendVideoMessageRequest).type = "video";
      (payload as CloudAPISendVideoMessageRequest).video = {
        caption: databaseMessage.content,
        link: (databaseMessage.extras as MessageExtras).video?.mediaUrl as string,
      };
      break;
    }
    case MessageType.audio: {
      (payload as CloudAPISendAudioMessageRequest).type = "audio";
      (payload as CloudAPISendAudioMessageRequest).audio = {
        link: (databaseMessage.extras as MessageExtras).audio?.mediaUrl as string,
      };
      break;
    }
  }

  return payload;
}

async function sendMessageToCloudApi(payload: CloudAPIMessageRequestBase, whatsappPhoneId: string): Promise<string> {
  const graphApiUrl = process.env.WHATSAPP_GRAPH_BASE_URL;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  const accessToken = process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN;

  const url = `${graphApiUrl}/${graphApiVersion}/${whatsappPhoneId}/messages`;

  const response = await axios.post<CloudAPIResponse>(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.data.messages[0].id;
}

export async function handleWhatsappMessageSend(
  roomId: number,
  propertyId: number,
  message: MessageToSend,
): Promise<void> {
  try {
    const payload = await enrichMessageToCloudApi(message, message.tenantPhoneNumber);
    const messageId = await sendMessageToCloudApi(payload, message.whatsappPhoneId);

    await prisma.messages.update({
      where: { id: message.id },
      data: {
        waId: messageId,
      },
    });
  } catch (error) {
    await prisma.messages.update({
      where: { id: message.id },
      data: {
        status: MessageStatus.failed,
      },
    });

    throw error;
  }

  const newMessage = await prisma.messages.findUniqueOrThrow({
    where: { id: message.id },
    select: {
      id: true,
      content: true,
      messageType: true,
      extras: true,
      waId: true,
      replyTo: true,
      roomId: true,
      senderType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      replyWaId: true,
    },
  });

  const [createdMessage] = await mapAuditUsers([newMessage]);

  await notifyNewSentMessage(propertyId, roomId, {
    ...createdMessage,
    extras: createdMessage.extras as MessageExtras | null,
  });
}
