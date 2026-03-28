import { TicketCategoriesWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

export type TicketCategoryApiItem = BaseApiData & {
  name: string;
  description: string | null;
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

    if (!user || !hasPermissions(user, "tickets-categories:view")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = ticketCategoryQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    const { page, size, search } = parsed;

    const where: TicketCategoriesWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.ticketCategories.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        createdAt: "desc",
      },
    });

    const ticketCategoriesCount = await prisma.ticketCategories.count({ where });

    const ticketCategories: TicketCategoryApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        ticketCategories,
        count: ticketCategoriesCount,
      },
      message: "Ticket categories fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tickets/categories", error);
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
