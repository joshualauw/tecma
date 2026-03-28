import { EmployeesWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

export type EmployeeApiItem = BaseApiData & {
  phoneNumber: string;
  user: {
    name: string;
    email: string;
    role: {
      id: number;
      name: string;
    };
  };
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

    if (!user || user.role !== "super-admin") throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = employeeQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
      roleId: searchParams.get("roleId"),
    });

    const { page, size, search, roleId } = parsed;

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

    const rows = await prisma.employees.findMany({
      select: {
        id: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
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
    const employees: EmployeeApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        employees,
        count: employeesCount,
      },
      message: "Employees fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/employees", error);
    return NextResponse.json(
      {
        data: null,
        message: response.message,
        success: false,
      },
      { status: response.code },
    );
  }
}
