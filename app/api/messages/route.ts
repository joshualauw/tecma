import { MessageStatus, MessageType, SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import type { MessageExtras } from "@/types/MessageExtras";
import z from "zod";

export type MessageApiItem = {
  id: number;
  waId: string | null;
  replyTo: {
    id: number;
    waId: string | null;
    content: string;
    messageType: MessageType;
  } | null;
  roomId: number;
  senderType: SenderType;
  status: MessageStatus;
  content: string;
  messageType: MessageType;
  extras: MessageExtras | null;
  createdAt: Date;
};

export type MessagesApiData = {
  messages: MessageApiItem[];
  count: number;
};

const messagesQuery = z.object({
  roomId: z.coerce.number().int().positive(),
});

export type MessagesApiResponse = ApiResponse<MessagesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<MessagesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = messagesQuery.safeParse({
      roomId: searchParams.get("roomId"),
    });

    if (!parsed.success) {
      console.error("Messages query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { roomId } = parsed.data;

    const messages = await prisma.messages.findMany({
      select: {
        id: true,
        waId: true,
        replyTo: {
          select: {
            id: true,
            waId: true,
            content: true,
            messageType: true,
          },
        },
        roomId: true,
        senderType: true,
        content: true,
        status: true,
        messageType: true,
        createdAt: true,
        extras: true,
      },
      where: {
        roomId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      data: {
        messages: messages.map((message) => ({
          ...message,
          extras: message.extras as MessageExtras | null,
        })),
        count: messages.length,
      },
      message: "Messages fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);

    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching messages",
        success: false,
      },
      { status: 500 },
    );
  }
}
