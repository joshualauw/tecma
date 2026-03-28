import { LeaseStatus } from "@/generated/prisma/enums";
import { TenantsWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, resolvePropertyIdScope } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";

export type LeanTenantApiItem = {
  id: number;
  name: string;
  leases: {
    id: number;
    unit: {
      id: number;
      code: string;
    };
  }[];
};

export type LeanTenantsApiData = {
  tenants: LeanTenantApiItem[];
};

const leanTenantQuery = z.object({
  propertyId: z.coerce.number().int().positive().nullable(),
});

export type LeanTenantsApiResponse = ApiResponse<LeanTenantsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<LeanTenantsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets:view", "tickets:create", "tickets:edit")) {
      throw new AuthorizationError();
    }

    const { searchParams } = new URL(request.url);

    const parsed = leanTenantQuery.parse({
      propertyId: searchParams.get("propertyId"),
    });

    const { propertyId } = parsed;

    const scope = resolvePropertyIdScope(user, propertyId);
    if (!scope.ok) throw new AuthorizationError();

    const where: TenantsWhereInput = {};

    if (scope.filter !== undefined) {
      where.propertyId = scope.filter;
    }

    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
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
      orderBy: {
        name: "desc",
      },
    });

    return NextResponse.json({
      data: {
        tenants,
      },
      message: "Tenants fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tenants/lean", error);
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
