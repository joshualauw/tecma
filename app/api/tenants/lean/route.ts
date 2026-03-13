import { LeaseStatus } from "@/generated/prisma/enums";
import { TenantsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

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
    const { searchParams } = new URL(request.url);

    const parsed = leanTenantQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
    });

    if (!parsed.success) {
      console.error("Lean tenant query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { propertyId } = parsed.data;

    const where: TenantsWhereInput = {};

    if (propertyId !== null) {
      where.propertyId = propertyId;
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
        name: "asc",
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
    console.error("Error fetching lean tenants:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching tenants",
        success: false,
      },
      { status: 500 },
    );
  }
}
