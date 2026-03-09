import { SenderType } from "@/generated/prisma/enums";
import { MessagesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type MessageApiItem = {
  id: number;
  senderType: SenderType;
  content: string;
  createdAt: Date;
};

export type MessagesApiData = {
  messages: MessageApiItem[];
  count: number;
};

const messagesQuery = z.object({
  roomId: z.coerce.number().int().positive(),
  senderType: z.enum(SenderType).nullable(),
});

export type MessagesApiResponse = ApiResponse<MessagesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<MessagesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = messagesQuery.safeParse({
      roomId: searchParams.get("roomId"),
      senderType: searchParams.get("senderType"),
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

    const { roomId, senderType } = parsed.data;

    const where: MessagesWhereInput = { roomId };

    if (senderType !== null) {
      where.senderType = senderType;
    }

    const messages = await prisma.messages.findMany({
      select: {
        id: true,
        senderType: true,
        content: true,
        createdAt: true,
      },
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      data: {
        messages,
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
