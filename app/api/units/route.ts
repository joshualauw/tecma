import { UnitsWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

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

    if (!user || !hasPermissions(user, "units:view")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = unitQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
    });

    const { page, size, search, propertyId } = parsed;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) throw new AuthorizationError();

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
        createdAt: "desc",
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
    const response = handleError("GET /api/units", error);
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
