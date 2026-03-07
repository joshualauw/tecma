import { EmployeesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type EmployeeApiItem = {
  id: number;
  name: string;
  phone_number: string;
  address: string | null;
  property: {
    id: number;
    name: string;
  };
  created_at: Date;
  updated_at: Date;
};

export type EmployeesApiData = {
  employees: EmployeeApiItem[];
  count: number;
};

export type EmployeesApiResponse = ApiResponse<EmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<EmployeesApiResponse>> {
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

    const where: EmployeesWhereInput = {};

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

    const employees = await prisma.employees.findMany({
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
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const employeesCount = await prisma.employees.count({ where });

    return NextResponse.json({
      data: {
        employees,
        count: employeesCount,
      },
      message: "Employees fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching employees",
        success: false,
      },
      { status: 500 },
    );
  }
}
