"use server";

import type { MessageApiItem } from "@/app/api/messages/route";
import { MessageType } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { handleWhatsappMessageCreate } from "@/lib/handlers/message/create";
import { handleWhatsappMessageSend } from "@/lib/handlers/message/send";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { AxiosError } from "axios";
import z from "zod";

const sendMessageSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive(),
  content: z.string().trim(),
  messageType: z.enum(MessageType).default(MessageType.text),
  file: z.instanceof(File).nullable(),
  filename: z.string().trim().nullable(),
});

type SendMessageActionResponse = ApiResponse<MessageApiItem>;

export async function sendMessageAction(formData: FormData): Promise<SendMessageActionResponse> {
  const parsed = sendMessageSchema.safeParse({
    roomId: formData.get("roomId"),
    propertyId: formData.get("propertyId"),
    content: formData.get("content"),
    messageType: formData.get("messageType"),
    file: formData.get("file"),
    filename: formData.get("filename"),
  });

  if (!parsed.success) {
    console.error("Send message schema validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { roomId, propertyId, content, messageType, file, filename } = parsed.data;

  try {
    const room = await prisma.rooms.findFirstOrThrow({
      where: { id: roomId },
      select: {
        tenant: { select: { phoneNumber: true } },
        whatsapp: { select: { phoneId: true } },
      },
    });

    const createdMessage = await handleWhatsappMessageCreate({
      roomId,
      propertyId,
      content,
      messageType,
      file,
      filename,
    });

    await handleWhatsappMessageSend({
      id: createdMessage.id,
      tenantPhoneNumber: room.tenant.phoneNumber,
      whatsappPhoneId: room.whatsapp.phoneId,
    });

    return {
      data: createdMessage,
      success: true,
      message: "Message sent successfully",
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error sending message to cloud API:", error.response?.data);
      return {
        success: false,
        message: "An error occurred while sending message to cloud API",
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      console.error("Room not found:", error);
      return { success: false, message: "Room not found" };
    }
    console.error("Error sending message:", error);
    return {
      success: false,
      message: "An error occurred while sending message",
    };
  }
}
