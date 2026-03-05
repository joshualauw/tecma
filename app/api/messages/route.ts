import { SenderType } from "@/generated/prisma/enums";
import { MessagesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type MessageApiItem = {
  id: number;
  sender_type: "tenant" | "bot" | "user";
  content: string;
  created_at: Date | null;
};

export type MessagesApiData = {
  messages: MessageApiItem[];
  count: number;
};

export type MessagesApiResponse = ApiResponse<MessagesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<MessagesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const roomIdParam = Number(searchParams.get("roomId"));
    const senderTypeParam = (searchParams.get("senderType") ?? "").trim();

    const roomId =
      Number.isFinite(roomIdParam) && Number.isInteger(roomIdParam) && roomIdParam > 0 ? roomIdParam : null;
    const senderType = senderTypeParam && senderTypeParam in SenderType ? senderTypeParam : null;

    if (roomId === null) {
      return NextResponse.json(
        {
          data: null,
          message: "roomId is required",
          success: false,
        },
        { status: 400 },
      );
    }

    const where: MessagesWhereInput = {
      room_id: roomId,
    };

    if (senderType !== null) {
      where.sender_type = senderType as (typeof SenderType)[keyof typeof SenderType];
    }

    const messages = await prisma.messages.findMany({
      select: {
        id: true,
        sender_type: true,
        content: true,
        created_at: true,
      },
      where,
      orderBy: {
        created_at: "asc",
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
