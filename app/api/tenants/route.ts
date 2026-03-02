import { TenantsWhereInput } from "@/generated/prisma/models";
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

    const where: TenantsWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone_number: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        phone_number: true,
        address: true,
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

    const tenantsCount = await prisma.tenants.count({ where });

    return NextResponse.json({
      data: {
        tenants,
        count: tenantsCount,
      },
      message: "Tenants fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
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
