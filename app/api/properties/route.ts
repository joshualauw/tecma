import { PropertiesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type PropertyApiItem = {
  id: number;
  name: string;
  address: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PropertiesApiData = {
  properties: PropertyApiItem[];
  count: number;
};

const propertyQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
});

export type PropertiesApiResponse = ApiResponse<PropertiesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<PropertiesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = propertyQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    if (!parsed.success) {
      console.error("Property query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search } = parsed.data;

    const where: PropertiesWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const properties = await prisma.properties.findMany({
      select: { id: true, name: true, address: true, created_at: true, updated_at: true },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const propertiesCount = await prisma.properties.count({ where });

    return NextResponse.json({
      data: {
        properties,
        count: propertiesCount,
      },
      message: "Properties fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching properties",
        success: false,
      },
      { status: 500 },
    );
  }
}
