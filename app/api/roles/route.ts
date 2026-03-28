import { RoleWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

export type RoleApiItem = BaseApiData & {
  name: string;
};

export type RolesApiData = {
  roles: RoleApiItem[];
  count: number;
};

const roleQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
});

export type RolesApiResponse = ApiResponse<RolesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<RolesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = roleQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    const { page, size, search } = parsed;

    const where: RoleWhereInput = {
      name: { not: "super-admin" },
    };

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    const rows = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
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

    const rolesCount = await prisma.role.count({ where });
    const roles: RoleApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        roles,
        count: rolesCount,
      },
      message: "Roles fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/roles", error);
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
