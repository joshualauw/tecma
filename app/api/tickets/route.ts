import { TicketsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type TicketApiItem = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  properties: {
    id: number;
    name: string;
  } | null;
  tenant: {
    id: number;
    name: string;
    unit: {
      id: number;
      code: string;
    } | null;
  } | null;
  category: {
    id: number;
    name: string;
  } | null;
  employee: {
    id: number;
    name: string;
  } | null;
  created_at: Date | null;
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

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;
    const propertyId =
      Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;

    const where: TicketsWhereInput = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    const tickets = await prisma.tickets.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        created_at: true,
        properties: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
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
