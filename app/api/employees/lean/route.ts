import { UserRole } from "@/generated/prisma/enums";
import { EmployeesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type LeanEmployeeApiItem = {
  id: number;
  name: string;
};

export type LeanEmployeesApiData = {
  employees: LeanEmployeeApiItem[];
};

const leanEmployeeQuery = z.object({
  propertyId: z.coerce.number().int().positive().nullable(),
  role: z.enum([UserRole.dispatcher, UserRole.worker]).nullable(),
});

export type LeanEmployeesApiResponse = ApiResponse<LeanEmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<LeanEmployeesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = leanEmployeeQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
      role: searchParams.get("role"),
    });

    if (!parsed.success) {
      console.error("Lean employee query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { propertyId, role } = parsed.data;

    const where: EmployeesWhereInput = {};

    if (propertyId !== null) {
      where.propertyId = propertyId;
    }

    if (role !== null) {
      where.user = { role };
    }

    const rows = await prisma.employees.findMany({
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      where,
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const employees = rows.map((row) => ({
      id: row.id,
      name: row.user.name,
    }));

    return NextResponse.json({
      data: {
        employees,
      },
      message: "Employees fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching lean employees:", error);
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
