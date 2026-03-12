import type { CloudAPIMessageRequestBase, CloudAPISendTextMessageRequest } from "@whatsapp-cloudapi/types/cloudapi";
import { MessageType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import axios from "axios";

type MessageToSend = {
  id: number;
  roomId: number;
  content: string;
  messageType: MessageType;
};

function enrichMessageToCloudApi(message: MessageToSend, to: string): CloudAPIMessageRequestBase {
  const toE164 = to.startsWith("+") ? to : `+${to}`;

  const payload: CloudAPIMessageRequestBase = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toE164,
  };

  switch (message.messageType) {
    case MessageType.text: {
      (payload as CloudAPISendTextMessageRequest).type = MessageType.text;
      (payload as CloudAPISendTextMessageRequest).text = {
        body: message.content.slice(0, 4096),
      };
      break;
    }
  }

  return payload;
}

export async function handleWhatsappMessageSend(message: MessageToSend): Promise<void> {
  const room = await prisma.rooms.findUnique({
    where: { id: message.roomId },
    select: {
      whatsapp: { select: { phoneId: true } },
      tenant: { select: { phoneNumber: true } },
    },
  });

  if (!room?.whatsapp || !room?.tenant) {
    throw new Error("Room, WhatsApp channel, or tenant not found");
  }

  const graphApiUrl = process.env.WHATSAPP_GRAPH_BASE_URL;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  const accessToken = process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN;
  const whatsappPhoneId = room.whatsapp.phoneId;

  const payload = enrichMessageToCloudApi(message, room.tenant.phoneNumber);
  const url = `${graphApiUrl}/${graphApiVersion}/${whatsappPhoneId}/messages`;

  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}
