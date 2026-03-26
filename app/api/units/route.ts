import { UnitsWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit-mapper";

export type UnitApiItem = BaseApiData & {
  code: string;
  property: {
    id: number;
    name: string;
  };
};

export type UnitsApiData = {
  units: UnitApiItem[];
  count: number;
};

const unitQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
});

export type UnitsApiResponse = ApiResponse<UnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<UnitsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "units:view")) {
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

    const parsed = unitQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
    });

    if (!parsed.success) {
      console.error("Unit query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search, propertyId } = parsed.data;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const where: UnitsWhereInput = {};

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    if (scope.filter !== undefined) {
      where.propertyId = scope.filter;
    }

    const rows = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        property: {
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
        createdAt: "asc",
      },
    });

    const unitsCount = await prisma.units.count({ where });
    const units: UnitApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        units,
        count: unitsCount,
      },
      message: "Units fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching units",
        success: false,
      },
      { status: 500 },
    );
  }
}
