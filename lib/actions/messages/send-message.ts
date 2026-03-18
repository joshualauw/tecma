"use server";

import { MessageType } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { handleWhatsappMessageCreate } from "@/lib/handlers/message/create";
import { handleWhatsappMessageSend } from "@/lib/handlers/message/send";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { AxiosError } from "axios";
import z from "zod";
import pusher from "@/lib/pusher";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";

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
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "inbox:send")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = sendMessageSchema.safeParse({
    roomId: formData.get("roomId"),
    replyWaId: formData.get("replyWaId"),
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

  const { roomId, propertyId, content, messageType, file, filename, replyWaId } = parsed.data;

  if (!userCanAccessProperty(user, propertyId)) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  try {
    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
      select: {
        propertyId: true,
        tenant: { select: { phoneNumber: true } },
        whatsapp: { select: { phoneId: true } },
      },
    });

    if (!room || room.propertyId !== propertyId) {
      return { success: false, message: "Room not found or property mismatch" };
    }

    const createdMessage = await handleWhatsappMessageCreate({
      roomId,
      propertyId,
      content,
      messageType,
      replyWaId,
      file,
      filename,
    });

    await handleWhatsappMessageSend({
      id: createdMessage.id,
      tenantPhoneNumber: room.tenant.phoneNumber,
      whatsappPhoneId: room.whatsapp.phoneId,
    });

    const users = await prisma.users.findMany({
      where: {
        OR: [
          { role: { name: "super-admin" } },
          {
            AND: [
              {
                role: {
                  rolePermissions: {
                    some: { permission: { name: "inbox:view" } },
                  },
                },
              },
              {
                employee: {
                  employeePermissions: {
                    some: { propertyId: room.propertyId },
                  },
                },
              },
            ],
          },
        ],
      },
      select: { id: true },
    });

    for (const user of users) {
      await pusher.trigger(`user-${user.id}`, "update-room", createdMessage);
    }
    await pusher.trigger(`room-${roomId}`, "new-message", createdMessage);

    return {
      data: null,
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
