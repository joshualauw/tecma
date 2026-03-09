import { SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import type { MessageApiItem } from "@/app/api/messages/route";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { Prisma } from "@/generated/prisma/client";

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

    const message = await prisma.messages.create({
      data: {
        roomId,
        propertyId,
        senderType: SenderType.user,
        content,
      },
      select: {
        id: true,
        senderType: true,
        content: true,
        createdAt: true,
      },
    });

    await prisma.rooms.update({
      where: { id: roomId },
      data: {
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
      },
    });

    return NextResponse.json({
      data: message,
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending message:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ data: null, success: false, message: "Room not found" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ data: null, success: false, message: "Property not found" }, { status: 404 });
      }
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
