import type { ApiResponse } from "@/types/ApiResponse";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { LeaseStatus, RoomStatus, TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import z from "zod";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { TicketsWhereInput } from "@/generated/prisma/models";
import { AuthorizationError, handleError } from "@/lib/error";

type RoomDetailTicket = {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: {
    id: number;
    name: string;
  } | null;
  ticketAssignments: {
    employee: {
      id: number;
      user: {
        name: string;
      };
    };
  }[];
  createdAt: Date;
};

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
    leases: {
      id: number;
      unit: {
        id: number;
        code: string;
      };
    }[];
  };
  whatsapp: {
    id: number;
    displayName: string;
    phoneNumber: string;
  };
  expiredAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  tickets: RoomDetailTicket[];
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
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "inbox:view")) throw new AuthorizationError();

    const contextParams = await context.params;
    const parsed = roomDetailQuery.parse({
      id: contextParams.id,
    });

    const { id } = parsed;

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
            leases: {
              where: {
                status: LeaseStatus.active,
              },
              select: {
                id: true,
                unit: {
                  select: {
                    id: true,
                    code: true,
                  },
                },
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
      throw new Error("Room not found");
    }

    if (!userCanAccessProperty(user, room.tenant.property.id)) throw new AuthorizationError();

    let tickets: RoomDetailTicket[] = [];

    if (hasPermissions(user, "tickets:view")) {
      const where: TicketsWhereInput = {
        lease: {
          tenantId: room.tenant.id,
        },
        status: { not: TicketStatus.closed },
      };

      if (user.role !== "super-admin") {
        where.ticketAssignments = {
          some: {
            employee: { userId: user.id },
          },
        };
      }

      tickets = await prisma.tickets.findMany({
        where,
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
          ticketAssignments: {
            select: {
              employee: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({
      data: {
        ...room,
        tickets,
      },
      message: "Room detail fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/rooms/[id]", error);
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
