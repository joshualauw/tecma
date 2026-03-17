import { TicketCategoriesWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type TicketCategoryApiItem = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketCategoriesApiData = {
  ticketCategories: TicketCategoryApiItem[];
  count: number;
};

const ticketCategoryQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
});

export type TicketCategoriesApiResponse = ApiResponse<TicketCategoriesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TicketCategoriesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!hasPermissions(user, "tickets:categories:view")) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const parsed = ticketCategoryQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    if (!parsed.success) {
      console.error("Ticket category query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search } = parsed.data;

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
        createdAt: true,
        updatedAt: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        createdAt: "asc",
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
