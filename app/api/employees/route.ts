import { UserRole } from "@/generated/prisma/enums";
import { EmployeesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type EmployeeApiItem = {
  id: number;
  phoneNumber: string;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  property: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeesApiData = {
  employees: EmployeeApiItem[];
  count: number;
};

const employeeQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
  propertyId: z.coerce.number().int().positive().nullable(),
  role: z.nativeEnum(UserRole).nullable(),
});

export type EmployeesApiResponse = ApiResponse<EmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<EmployeesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = employeeQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      propertyId: searchParams.get("propertyId"),
      role: searchParams.get("role"),
    });

    if (!parsed.success) {
      console.error("Employee query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search, propertyId, role } = parsed.data;

    const where: EmployeesWhereInput = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (propertyId !== null) {
      where.propertyId = propertyId;
    }

    if (role !== null) {
      where.user = { role };
    }

    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
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
        createdAt: "asc",
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
