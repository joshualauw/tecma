import { MessageStatus, MessageType, SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import type { MessageExtras } from "@/types/MessageExtras";
import z from "zod";
import { handleError } from "@/lib/errors";
import { mapAuditUsers } from "@/lib/mappers/audit";

export type MessageApiItem = BaseApiData & {
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
    const parsed = messagesQuery.parse({
      roomId: searchParams.get("roomId"),
    });

    const { roomId } = parsed;

    const rows = await prisma.messages.findMany({
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
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        extras: true,
      },
      where: {
        roomId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const messages = await mapAuditUsers(
      rows.map((row) => ({
        ...row,
        extras: row.extras as MessageExtras | null,
      })),
    );

    return NextResponse.json({
      data: {
        messages,
        count: messages.length,
      },
      message: "Messages fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/messages", error);
    return NextResponse.json(
      {
        data: null,
        message: response.message,
        success: false,
      },
      { status: response.code },
    );
  }
}
