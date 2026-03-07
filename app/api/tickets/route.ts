import { TicketsWhereInput } from "@/generated/prisma/models";
import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import type { TicketsModel } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type TicketApiItem = {
  id: number;
  title: string;
  description: string | null;
  status: TicketsModel["status"];
  priority: TicketsModel["priority"];
  property: {
    id: number;
    name: string;
  };
  tenant: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    code: string;
  };
  category: {
    id: number;
    name: string;
  };
  employee: {
    id: number;
    name: string;
  };
  created_at: Date;
  updated_at: Date;
};

export type TicketsApiData = {
  tickets: TicketApiItem[];
  count: number;
};

export type TicketsApiResponse = ApiResponse<TicketsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TicketsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();
    const propertyIdParam = Number(searchParams.get("propertyId"));
    const statusParam = (searchParams.get("status") ?? "").trim();
    const priorityParam = (searchParams.get("priority") ?? "").trim();

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;
    const propertyId =
      Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;
    const status = statusParam && statusParam in TicketStatus ? statusParam : null;
    const priority = priorityParam && priorityParam in TicketPriority ? priorityParam : null;

    const where: TicketsWhereInput = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    if (status !== null) {
      where.status = status as (typeof TicketStatus)[keyof typeof TicketStatus];
    }

    if (priority !== null) {
      where.priority = priority as (typeof TicketPriority)[keyof typeof TicketPriority];
    }

    const tickets = await prisma.tickets.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        created_at: true,
        updated_at: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
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
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const count = await prisma.tickets.count({ where });

    return NextResponse.json({
      data: {
        tickets,
        count,
      },
      message: "Tickets fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching tickets",
        success: false,
      },
      { status: 500 },
    );
  }
}
