import { MessageType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import type { MessageApiItem } from "@/app/api/messages/route";
import { handleWhatsappMessageCreate } from "@/lib/handlers/message/create";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { handleWhatsappMessageSend } from "@/lib/handlers/message/send";
import { AxiosError } from "axios";

const sendMessageSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1),
  messageType: z.enum(MessageType).default(MessageType.text),
});

type SendMessageApiResponse = ApiResponse<MessageApiItem>;

export async function POST(request: NextRequest): Promise<NextResponse<SendMessageApiResponse>> {
  try {
    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Send message schema validation failed:", parsed.error);
      throw new ZodError(parsed.error.issues);
    }

    const { roomId, propertyId, content, messageType } = parsed.data;

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
    });

    await handleWhatsappMessageSend({
      id: createdMessage.id,
      tenantPhoneNumber: room.tenant.phoneNumber,
      whatsappPhoneId: room.whatsapp.phoneId,
    });

    return NextResponse.json({
      data: createdMessage,
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error sending message to cloud API:", error.response?.data);
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "An error occurred while sending message to cloud API",
        },
        { status: 500 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      console.error("Room not found:", error);
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "Room not found",
        },
        { status: 404 },
      );
    } else if (error instanceof ZodError) {
      console.error("Validation error:", error.issues);
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "Validation error",
        },
        { status: 400 },
      );
    } else {
      console.error("Error sending message:", error);
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "An error occurred while sending message",
        },
        { status: 500 },
      );
    }
  }
}
