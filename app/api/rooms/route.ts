import { RoomStatus } from "@/generated/prisma/enums";
import { RoomsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type RoomApiItem = {
  id: number;
  tenant: {
    id: number;
    name: string;
  } | null;
  whatsapp: {
    id: number;
    displayName: string;
  };
  lastMessage: string | null;
  lastMessageAt: Date | null;
  status: RoomStatus;
};

export type RoomsApiData = {
  rooms: RoomApiItem[];
  count: number;
};

const roomQuery = z.object({
  propertyId: z.coerce.number().int().positive().nullable(),
  status: z.enum(RoomStatus).nullable(),
});

export type RoomsApiResponse = ApiResponse<RoomsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<RoomsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = roomQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
      status: searchParams.get("status"),
    });

    if (!parsed.success) {
      console.error("Room query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { propertyId, status } = parsed.data;

    const where: RoomsWhereInput = {};

    if (propertyId !== null) {
      where.propertyId = propertyId;
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
            displayName: true,
          },
        },
        status: true,
        lastMessage: true,
        lastMessageAt: true,
      },
      where,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
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
