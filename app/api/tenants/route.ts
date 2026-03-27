import { LeaseStatus } from "@/generated/prisma/enums";
import { TenantsWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/error";

export type TenantApiItem = BaseApiData & {
  name: string;
  phoneNumber: string;
  property: {
    id: number;
    name: string;
  };
  leases: {
    id: number;
    unit: {
      id: number;
      code: string;
    };
  }[];
};

export type TenantsApiData = {
  tenants: TenantApiItem[];
  count: number;
};

const tenantQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
});

export type TenantsApiResponse = ApiResponse<TenantsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TenantsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants:view")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = tenantQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
    });

    const { page, size, search, propertyId } = parsed;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) throw new AuthorizationError();

    const where: TenantsWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (scope.filter !== undefined) {
      where.propertyId = scope.filter;
    }

    const rows = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
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
        leases: {
          where: {
            status: LeaseStatus.active,
          },
          select: {
            id: true,
            unit: {
              select: {
                id: true,
                code: true,
              },
            },
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

    const tenantsCount = await prisma.tenants.count({ where });
    const tenants: TenantApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        tenants,
        count: tenantsCount,
      },
      message: "Tenants fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tenants", error);
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
