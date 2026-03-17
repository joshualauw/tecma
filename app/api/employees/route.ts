import { EmployeesWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getAuthenticatedUser } from "@/lib/permission";

export type EmployeeApiItem = {
  id: number;
  phoneNumber: string;
  user: {
    name: string;
    email: string;
    role: {
      id: number;
      name: string;
    };
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
  roleId: z.coerce.number().int().positive().nullable(),
});

export type EmployeesApiResponse = ApiResponse<EmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<EmployeesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!hasPermissions(user, "employees:view")) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    const parsed = employeeQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      roleId: searchParams.get("roleId"),
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

    const { page, size, search, roleId } = parsed.data;

    const where: EmployeesWhereInput = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleId !== null) {
      where.user = { role: { id: roleId } };
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
