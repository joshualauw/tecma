import { prisma } from "@/lib/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { LeaseStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/error";

export type TenantLeaseApiItem = BaseApiData & {
  startDate: Date;
  endDate: Date;
  status: LeaseStatus;
  property: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    code: string;
  };
  tenant: {
    id: number;
    name: string;
  };
};

export type TenantLeasesApiData = {
  leases: TenantLeaseApiItem[];
};

const tenantLeasesQuery = z.object({
  id: z.coerce.number().int().positive(),
});

export type TenantLeasesApiResponse = ApiResponse<TenantLeasesApiData>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<TenantLeasesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants-leases:view")) throw new AuthorizationError();

    const contextParams = await context.params;
    const parsed = tenantLeasesQuery.parse({ id: contextParams.id });
    const { id } = parsed;

    const tenant = await prisma.tenants.findFirstOrThrow({
      where: { id },
      select: { propertyId: true },
    });

    if (!userCanAccessProperty(user, tenant.propertyId)) throw new AuthorizationError();

    const rows = await prisma.leases.findMany({
      where: { tenantId: id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        startDate: true,
        endDate: true,
        status: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            code: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
    const leases: TenantLeaseApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: { leases },
      message: "Tenant leases fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tenants/[id]/leases", error);
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
