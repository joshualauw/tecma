import { RoomStatus } from "@/generated/prisma/enums";
import { RoomsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type RoomApiItem = {
  id: number;
  tenant: {
    id: number;
    name: string;
  } | null;
  whatsapp: {
    id: number;
    display_name: string;
  };
  last_message: string | null;
  last_message_at: Date | null;
  status: RoomStatus;
};

export type RoomsApiData = {
  rooms: RoomApiItem[];
  count: number;
};

export type RoomsApiResponse = ApiResponse<RoomsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<RoomsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const propertyIdParam = Number(searchParams.get("propertyId"));
    const statusParam = (searchParams.get("status") ?? "").trim();
    const roomStatuses = Object.values(RoomStatus) as Array<(typeof RoomStatus)[keyof typeof RoomStatus]>;

    const propertyId =
      Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;
    const status = roomStatuses.includes(statusParam as (typeof RoomStatus)[keyof typeof RoomStatus])
      ? (statusParam as (typeof RoomStatus)[keyof typeof RoomStatus])
      : null;

    const where: RoomsWhereInput = {};

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    if (status !== null) {
      where.status = status;
    }

    const rooms = await prisma.rooms.findMany({
      select: {
        id: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        whatsapp: {
          select: {
            id: true,
            display_name: true,
          },
        },
        status: true,
        last_message: true,
        last_message_at: true,
      },
      where,
      orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
    });

    return NextResponse.json({
      data: {
        rooms,
        count: rooms.length,
      },
      message: "Rooms fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);

    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching rooms",
        success: false,
      },
      { status: 500 },
    );
  }
}
