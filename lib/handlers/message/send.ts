import type {
  CloudAPIMessageRequestBase,
  CloudAPISendTextMessageRequest,
  CloudAPIResponse,
} from "@whatsapp-cloudapi/types/cloudapi";
import { MessageType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import axios from "axios";

type MessageToSend = {
  id: number;
  tenantPhoneNumber: string;
  whatsappPhoneId: string;
};

async function enrichMessageToCloudApi(message: MessageToSend, to: string): Promise<CloudAPIMessageRequestBase> {
  const databaseMessage = await prisma.messages.findUniqueOrThrow({
    where: { id: message.id },
  });

  const toE164 = to.startsWith("+") ? to : `+${to}`;

  const payload: CloudAPIMessageRequestBase = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toE164,
  };

  switch (databaseMessage.messageType) {
    case MessageType.text: {
      (payload as CloudAPISendTextMessageRequest).type = MessageType.text;
      (payload as CloudAPISendTextMessageRequest).text = {
        body: databaseMessage.content.slice(0, 4096),
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

export async function handleWhatsappMessageSend(message: MessageToSend): Promise<void> {
  const payload = await enrichMessageToCloudApi(message, message.tenantPhoneNumber);
  const messageId = await sendMessageToCloudApi(payload, message.whatsappPhoneId);

  await prisma.messages.update({
    where: { id: message.id },
    data: {
      waId: messageId,
    },
  });
}
