import { RoomStatus } from "@/generated/prisma/enums";
import { RoomsWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/helpers/permission";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { mapAuditUsers } from "@/lib/mappers/audit";

export type RoomApiItem = BaseApiData & {
  tenant: {
    id: number;
    name: string;
  };
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
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "inbox:view")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = roomQuery.parse({
      propertyId: searchParams.get("propertyId"),
      status: searchParams.get("status"),
    });

    const { propertyId, status } = parsed;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) throw new AuthorizationError();

    const where: RoomsWhereInput = {};

    if (scope.filter !== undefined) {
      where.propertyId = scope.filter;
    }

    if (status !== null) {
      where.status = status;
    }

    const rows = await prisma.rooms.findMany({
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
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
      where,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    });

    const rooms = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        rooms,
        count: rooms.length,
      },
      message: "Rooms fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/rooms", error);
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
