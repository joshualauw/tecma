import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type AvailableUnitsApiItem = {
  id: number;
  code: string;
};

export type AvailableUnitsApiData = {
  units: AvailableUnitsApiItem[];
};

const availableUnitsQuery = z.object({
  propertyId: z.coerce.number().int().positive(),
  tenantId: z.coerce.number().int().positive(),
});

export type AvailableUnitsApiResponse = ApiResponse<AvailableUnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<AvailableUnitsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = availableUnitsQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
      tenantId: searchParams.get("tenantId"),
    });

    if (!parsed.success) {
      console.error("Available units query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { propertyId, tenantId } = parsed.data;

    const units = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
      },
      where: {
        property_id: propertyId,
        OR: [
          {
            tenants: {
              none: {},
            },
          },
          ...(tenantId !== null
            ? [
                {
                  id: tenantId,
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
