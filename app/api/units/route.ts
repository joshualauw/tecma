import { UnitsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

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

const unitQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
});

export type UnitsApiResponse = ApiResponse<UnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<UnitsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = unitQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
    });

    if (!parsed.success) {
      console.error("Unit query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search, propertyId } = parsed.data;

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
