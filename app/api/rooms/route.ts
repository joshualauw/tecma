import { RoomStatus } from "@/generated/prisma/enums";
import { RoomsWhereInput } from "@/generated/prisma/models";
import type { RoomsModel } from "@/generated/prisma/models";
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
  } | null;
  last_message: string | null;
  last_message_at: Date | null;
  status: RoomsModel["status"];
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
        status: true,
        last_message: true,
        last_message_at: true,
        tenants: {
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
      },
      where,
      orderBy: [{ last_message_at: "desc" }, { created_at: "desc" }],
    });

    const mappedRooms: RoomApiItem[] = rooms.map((room) => ({
      id: room.id,
      tenant: room.tenants
        ? {
            id: room.tenants.id,
            name: room.tenants.name,
          }
        : null,
      whatsapp: room.whatsapp
        ? {
            id: room.whatsapp.id,
            display_name: room.whatsapp.display_name,
          }
        : null,
      last_message: room.last_message,
      last_message_at: room.last_message_at,
      status: room.status,
    }));

    return NextResponse.json({
      data: {
        rooms: mappedRooms,
        count: mappedRooms.length,
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
