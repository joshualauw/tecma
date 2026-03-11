import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import type { MessageApiItem } from "@/app/api/messages/route";
import { handleWhatsappMessageSend } from "@/lib/handlers/message/send";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { AxiosError } from "axios";

const sendMessageSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1),
});

type SendMessageApiResponse = ApiResponse<MessageApiItem>;

export async function POST(request: NextRequest): Promise<NextResponse<SendMessageApiResponse>> {
  try {
    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Send message schema validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "Invalid request body",
        },
        { status: 400 },
      );
    }

    const { roomId, propertyId, content } = parsed.data;

    const createdMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.messages.create({
        data: {
          roomId,
          propertyId,
          senderType: "user",
          content,
        },
      });

      await tx.rooms.update({
        where: { id: roomId },
        data: {
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
        },
      });

      return message;
    });

    await handleWhatsappMessageSend({
      id: createdMessage.id,
      roomId: createdMessage.roomId,
      content: createdMessage.content,
      messageType: createdMessage.messageType,
    });

    return NextResponse.json({
      data: createdMessage,
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Error sending message:", error.response?.data);
    } else {
      console.error("Error sending message:", error);
    }

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
