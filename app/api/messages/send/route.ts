import { SenderType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import type { MessageApiItem } from "@/app/api/messages/route";
import { NextRequest, NextResponse } from "next/server";

type SendMessagePayload = {
  roomId?: number;
  propertyId?: number;
  content?: string;
};

type SendMessageApiResponse = ApiResponse<MessageApiItem>;

export async function POST(request: NextRequest): Promise<NextResponse<SendMessageApiResponse>> {
  try {
    const body = (await request.json()) as SendMessagePayload;

    const roomId = Number(body.roomId);
    const propertyId = Number(body.propertyId);
    const content = (body.content ?? "").trim();

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "roomId is required",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "propertyId is required",
        },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "content is required",
        },
        { status: 400 },
      );
    }

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) {
      return NextResponse.json(
        {
          data: null,
          success: false,
          message: "Room not found",
        },
        { status: 404 },
      );
    }

    const message = await prisma.messages.create({
      data: {
        room_id: roomId,
        property_id: propertyId,
        sender_type: SenderType.user,
        content,
      },
      select: {
        id: true,
        sender_type: true,
        content: true,
        created_at: true,
      },
    });

    await prisma.rooms.update({
      where: { id: roomId },
      data: {
        last_message: message.content,
        last_message_at: message.created_at,
      },
    });

    return NextResponse.json({
      data: message,
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
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
