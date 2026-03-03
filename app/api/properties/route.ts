import { PropertiesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type PropertyApiItem = {
  id: number;
  name: string;
  address: string | null;
  created_at: Date | null;
};

export type PropertiesApiData = {
  properties: PropertyApiItem[];
  count: number;
};

export type PropertiesApiResponse = ApiResponse<PropertiesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<PropertiesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;

    const where: PropertiesWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const properties = await prisma.properties.findMany({
      select: { id: true, name: true, address: true, created_at: true },
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
