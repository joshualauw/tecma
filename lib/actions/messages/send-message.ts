"use server";

import { MessageType } from "@/generated/prisma/enums";
import { handleWhatsappMessageCreate } from "./_handlers/create-message";
import { handleWhatsappMessageSend } from "./_handlers/send-message";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { AuthorizationError, handleError } from "@/lib/errors";

const sendMessageSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  replyWaId: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive(),
  content: z.string().trim(),
  messageType: z.enum(MessageType).default(MessageType.text),
  file: z.instanceof(File).nullable(),
  filename: z.string().trim().nullable(),
});

type SendMessageActionResponse = ApiResponse<null>;

export async function sendMessageAction(formData: FormData): Promise<SendMessageActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "inbox:send")) throw new AuthorizationError();

    const parsed = sendMessageSchema.parse({
      roomId: formData.get("roomId"),
      replyWaId: formData.get("replyWaId"),
      propertyId: formData.get("propertyId"),
      content: formData.get("content"),
      messageType: formData.get("messageType"),
      file: formData.get("file"),
      filename: formData.get("filename"),
    });

    const { roomId, propertyId, content, messageType, file, filename, replyWaId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
      select: {
        propertyId: true,
        tenant: { select: { phoneNumber: true } },
        whatsapp: { select: { phoneId: true } },
      },
    });

    if (!room || room.propertyId !== propertyId) {
      throw new Error("Room not found or property mismatch");
    }

    const createdMessage = await handleWhatsappMessageCreate({
      roomId,
      propertyId,
      content,
      messageType,
      replyWaId,
      file,
      filename,
      createdBy: user.id,
    });

    await handleWhatsappMessageSend(roomId, propertyId, {
      id: createdMessage.id,
      tenantPhoneNumber: room.tenant.phoneNumber,
      whatsappPhoneId: room.whatsapp.phoneId,
    });

    return {
      data: null,
      success: true,
      message: "Message sent successfully",
    };
  } catch (error) {
    const response = handleError("sendMessageAction", error);
    return { success: false, message: response.message };
  }
}
