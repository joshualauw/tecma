import type { ApiResponse } from "@/types/ApiResponse";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type RoomDetailApiItem = {
  id: number;
  status: "active" | "closed" | "expired";
  tenant: {
    id: number;
    name: string;
    phone_number: string;
    property: {
      id: number;
      name: string;
    } | null;
    unit: {
      id: number;
      code: string;
    } | null;
  } | null;
  whatsapp: {
    id: number;
    display_name: string;
    phone_number: string;
  } | null;
  last_message: string | null;
  last_message_at: Date | null;
  expired_at: Date;
  closed_at: Date | null;
  created_at: Date | null;
  tickets: {
    id: number;
    title: string;
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    category: {
      id: number;
      name: string;
    } | null;
    employee: {
      id: number;
      name: string;
    } | null;
    created_at: Date | null;
  }[];
};

export type RoomDetailApiResponse = ApiResponse<RoomDetailApiItem>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<RoomDetailApiResponse>> {
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

    const room = await prisma.rooms.findUnique({
      where: {
        id: roomId,
      },
      select: {
        id: true,
        status: true,
        last_message: true,
        last_message_at: true,
        expired_at: true,
        closed_at: true,
        created_at: true,
        tenants: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            properties: {
              select: {
                id: true,
                name: true,
              },
            },
            unit: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
        whatsapp: {
          select: {
            id: true,
            display_name: true,
            phone_number: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        {
          data: null,
          message: "Room not found",
          success: false,
        },
        { status: 404 },
      );
    }

    const tickets = room.tenants
      ? await prisma.tickets.findMany({
          where: {
            tenant_id: room.tenants.id,
            status: { not: "closed" },
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
              },
            },
            created_at: true,
          },
          orderBy: {
            created_at: "desc",
          },
        })
      : [];

    return NextResponse.json({
      data: {
        id: room.id,
        status: room.status,
        tenant: room.tenants
          ? {
              id: room.tenants.id,
              name: room.tenants.name,
              phone_number: room.tenants.phone_number,
              property: room.tenants.properties
                ? {
                    id: room.tenants.properties.id,
                    name: room.tenants.properties.name,
                  }
                : null,
              unit: room.tenants.unit
                ? {
                    id: room.tenants.unit.id,
                    code: room.tenants.unit.code,
                  }
                : null,
            }
          : null,
        whatsapp: room.whatsapp
          ? {
              id: room.whatsapp.id,
              display_name: room.whatsapp.display_name,
              phone_number: room.whatsapp.phone_number,
            }
          : null,
        last_message: room.last_message,
        last_message_at: room.last_message_at,
        expired_at: room.expired_at,
        closed_at: room.closed_at,
        created_at: room.created_at,
        tickets,
      },
      message: "Room detail fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching room detail:", error);

    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching room detail",
        success: false,
      },
      { status: 500 },
    );
  }
}
