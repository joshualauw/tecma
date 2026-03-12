import { TenantsWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type TenantApiItem = {
  id: number;
  name: string;
  phoneNumber: string;
  property: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    code: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type TenantsApiData = {
  tenants: TenantApiItem[];
  count: number;
};

const tenantQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
});

export type TenantsApiResponse = ApiResponse<TenantsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<TenantsApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = tenantQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
    });

    if (!parsed.success) {
      console.error("Tenant query validation failed:", parsed.error);
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

    const where: TenantsWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (propertyId !== null) {
      where.propertyId = propertyId;
    }

    const tenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
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
        createdAt: "asc",
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
