import { UnitsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;

    const where: UnitsWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { properties: { is: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {};

    const units = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
        created_at: true,
        properties: {
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
