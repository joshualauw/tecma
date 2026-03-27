import { TicketsWhereInput } from "@/generated/prisma/models";
import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/error";

export type TicketApiItem = BaseApiData & {
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  property: {
    id: number;
    name: string;
  };
  lease: {
    tenant: {
      id: number;
      name: string;
    };
    unit: {
      id: number;
      code: string;
    };
  };
  category: {
    id: number;
    name: string;
  } | null;
};

export type TicketsApiData = {
  tickets: TicketApiItem[];
  count: number;
};

const ticketQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
  categoryId: z.coerce.number().int().positive().nullable(),
  status: z.enum(TicketStatus).nullable(),
  priority: z.enum(TicketPriority).nullable(),
});

export type TicketsApiResponse = ApiResponse<TicketsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TicketsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets:view")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = ticketQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
      categoryId: searchParams.get("categoryId"),
      status: searchParams.get("status"),
      priority: searchParams.get("priority"),
    });

    const { page, size, search, propertyId, categoryId, status, priority } = parsed;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) throw new AuthorizationError();

    const where: TicketsWhereInput = {};

    if (user.role !== "super-admin") {
      where.ticketAssignments = { some: { employee: { userId: user.id } } };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { lease: { tenant: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (scope.filter !== undefined) {
      where.propertyId = scope.filter;
    }

    if (categoryId !== null) {
      where.categoryId = categoryId;
    }

    if (status !== null) {
      where.status = status;
    }

    if (priority !== null) {
      where.priority = priority;
    }

    const rows = await prisma.tickets.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        lease: {
          select: {
            tenant: {
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
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: true,
        updatedBy: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        createdAt: "asc",
      },
    });

    const count = await prisma.tickets.count({ where });

    const tickets: TicketApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        tickets,
        count,
      },
      message: "Tickets fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tickets", error);
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
