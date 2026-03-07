import { TenantsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type TenantApiItem = {
  id: number;
  name: string;
  phone_number: string;
  address: string | null;
  property: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    code: string;
  };
  created_at: Date;
  updated_at: Date;
};

export type TenantsApiData = {
  tenants: TenantApiItem[];
  count: number;
};

export type TenantsApiResponse = ApiResponse<TenantsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TenantsApiResponse>> {
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

    const where: TenantsWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone_number: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (propertyId !== null) {
      where.property_id = propertyId;
    }

    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        phone_number: true,
        address: true,
        created_at: true,
        updated_at: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            code: true,
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
