import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type AvailableUnitsApiItem = {
  id: number;
  code: string;
};

export type AvailableUnitsApiData = {
  units: AvailableUnitsApiItem[];
};

export type AvailableUnitsApiResponse = ApiResponse<AvailableUnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<AvailableUnitsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const propertyIdParam = Number(searchParams.get("propertyId"));
    const tenantIdParam = Number(searchParams.get("tenantId"));

    if (!Number.isInteger(propertyIdParam) || propertyIdParam <= 0) {
      return NextResponse.json(
        {
          data: null,
          message: "A valid propertyId is required",
          success: false,
        },
        { status: 400 },
      );
    }

    const tenantId = Number.isInteger(tenantIdParam) && tenantIdParam > 0 ? tenantIdParam : null;

    let currentTenantUnitId: number | null = null;
    if (tenantId !== null) {
      const tenant = await prisma.tenants.findUnique({
        where: {
          id: tenantId,
        },
        select: {
          unit_id: true,
        },
      });
      currentTenantUnitId = tenant?.unit_id ?? null;
    }

    const units = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
      },
      where: {
        property_id: propertyIdParam,
        OR: [
          {
            tenants: {
              none: {},
            },
          },
          ...(currentTenantUnitId !== null
            ? [
                {
                  id: currentTenantUnitId,
                },
              ]
            : []),
        ],
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      data: {
        units,
      },
      message: "Available units fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching available units:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching available units",
        success: false,
      },
      { status: 500 },
    );
  }
}
