import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { LeaseStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { NextResponse } from "next/server";
import z from "zod";
import { Prisma } from "@/generated/prisma/client";

export type TenantLeaseApiItem = {
  id: number;
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

    if (!user || !hasPermissions(user, "tenants-leases:view")) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const contextParams = await context.params;
    const parsed = tenantLeasesQuery.safeParse({ id: contextParams.id });

    if (!parsed.success) {
      console.error("Tenant leases query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    const tenant = await prisma.tenants.findFirstOrThrow({
      where: { id },
      select: { propertyId: true },
    });

    if (!userCanAccessProperty(user, tenant.propertyId)) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const leases = await prisma.leases.findMany({
      where: { tenantId: id },
      select: {
        id: true,
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

    return NextResponse.json({
      data: { leases },
      message: "Tenant leases fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching tenant leases:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        {
          data: null,
          message: "Lease not found",
          success: false,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching tenant leases",
        success: false,
      },
      { status: 500 },
    );
  }
}
