import { UnitsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type UnitApiItem = {
  id: number;
  code: string;
  property: {
    id: number;
    name: string;
  };
  created_at: Date;
  updated_at: Date;
};

export type UnitsApiData = {
  units: UnitApiItem[];
  count: number;
};

export type UnitsApiResponse = ApiResponse<UnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<UnitsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();
    const propertyIdParam = Number(searchParams.get("propertyId"));

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;
    const propertyId =
      Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;

    const where: UnitsWhereInput = {};

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    const units = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
        created_at: true,
        updated_at: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const unitsCount = await prisma.units.count({ where });

    return NextResponse.json({
      data: {
        units,
        count: unitsCount,
      },
      message: "Units fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching units",
        success: false,
      },
      { status: 500 },
    );
  }
}
