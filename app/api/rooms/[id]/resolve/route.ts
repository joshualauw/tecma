import type { RoomsModel } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextResponse } from "next/server";

export type ResolveRoomApiItem = {
  id: number;
  status: RoomsModel["status"];
  closed_at: Date | null;
};

export type ResolveRoomApiResponse = ApiResponse<ResolveRoomApiItem>;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<ResolveRoomApiResponse>> {
  try {
    const { id: idParam } = await context.params;
    const roomId = Number(idParam);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return NextResponse.json(
        {
          data: null,
          message: "Invalid room id",
          success: false,
        },
        { status: 400 },
      );
    }

    const existingRoom = await prisma.rooms.findUnique({
      where: {
        id: roomId,
      },
      select: {
        id: true,
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        {
          data: null,
          message: "Room not found",
          success: false,
        },
        { status: 404 },
      );
    }

    const closedAt = new Date();
    const updatedRoom = await prisma.rooms.update({
      where: {
        id: roomId,
      },
      data: {
        status: "closed",
        closed_at: closedAt,
      },
      select: {
        id: true,
        status: true,
        closed_at: true,
      },
    });

    return NextResponse.json({
      data: updatedRoom,
      message: "Room resolved successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error resolving room:", error);

    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while resolving room",
        success: false,
      },
      { status: 500 },
    );
  }
}
