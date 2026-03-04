import { TicketCategoriesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type TicketCategoryApiItem = {
  id: number;
  name: string;
  description: string | null;
  created_at: Date | null;
};

export type TicketCategoriesApiData = {
  ticketCategories: TicketCategoryApiItem[];
  count: number;
};

export type TicketCategoriesApiResponse = ApiResponse<TicketCategoriesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TicketCategoriesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;

    const where: TicketCategoriesWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const ticketCategories = await prisma.ticketCategories.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const ticketCategoriesCount = await prisma.ticketCategories.count({ where });

    return NextResponse.json({
      data: {
        ticketCategories,
        count: ticketCategoriesCount,
      },
      message: "Ticket categories fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching ticket categories:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching ticket categories",
        success: false,
      },
      { status: 500 },
    );
  }
}
