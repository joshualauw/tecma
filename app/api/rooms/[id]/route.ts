import type { ApiResponse } from "@/types/ApiResponse";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { RoomStatus, TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import z from "zod";

export type RoomDetailApiItem = {
  id: number;
  status: RoomStatus;
  tenant: {
    id: number;
    name: string;
    phoneNumber: string;
    property: {
      id: number;
      name: string;
    };
    unit: {
      id: number;
      code: string;
    };
  };
  whatsapp: {
    id: number;
    displayName: string;
    phoneNumber: string;
  };
  expiredAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  tickets: {
    id: number;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: {
      id: number;
      name: string;
    };
    employee: {
      id: number;
      name: string;
    };
    createdAt: Date;
  }[];
};

const roomDetailQuery = z.object({
  id: z.coerce.number().int().positive(),
});

export type RoomDetailApiResponse = ApiResponse<RoomDetailApiItem>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<RoomDetailApiResponse>> {
  try {
    const contextParams = await context.params;
    const parsed = roomDetailQuery.safeParse({
      id: contextParams.id,
    });

    if (!parsed.success) {
      console.error("Room detail query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    const room = await prisma.rooms.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        expiredAt: true,
        closedAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            property: {
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
            displayName: true,
            phoneNumber: true,
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

    const tickets = await prisma.tickets.findMany({
      where: {
        tenantId: room.tenant.id,
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
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: {
        ...room,
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
