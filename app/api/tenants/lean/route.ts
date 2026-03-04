import { TenantsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type LeanTenantApiItem = {
  id: number;
  name: string;
  unit: {
    id: number;
    code: string;
  } | null;
};

export type LeanTenantsApiData = {
  tenants: LeanTenantApiItem[];
};

export type LeanTenantsApiResponse = ApiResponse<LeanTenantsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<LeanTenantsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const propertyIdRaw = searchParams.get("propertyId");

    const isPropertyIdNull = propertyIdRaw === null || propertyIdRaw.trim() === "" || propertyIdRaw === "null";
    const propertyIdParam = Number(propertyIdRaw);
    const propertyId =
      !isPropertyIdNull && Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;

    const where: TenantsWhereInput = {};

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        unit: {
          select: {
            id: true,
            code: true,
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
