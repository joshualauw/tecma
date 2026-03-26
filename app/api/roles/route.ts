import { RoleWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";

export type RoleApiItem = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
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

    if (!isSuperAdmin(user)) {
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

    const parsed = roleQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    if (!parsed.success) {
      console.error("Role query validation failed:", parsed.error);
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

    const where: RoleWhereInput = {
      name: { not: "super-admin" },
    };

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
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

    const rolesCount = await prisma.role.count({ where });

    return NextResponse.json({
      data: {
        roles,
        count: rolesCount,
      },
      message: "Roles fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching roles",
        success: false,
      },
      { status: 500 },
    );
  }
}
