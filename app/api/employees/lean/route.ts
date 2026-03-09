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
});

export type LeanEmployeesApiResponse = ApiResponse<LeanEmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<LeanEmployeesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = leanEmployeeQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
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

    const { propertyId } = parsed.data;

    const where: EmployeesWhereInput = {};

    if (propertyId !== null) {
      where.propertyId = propertyId;
    }

    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        name: true,
      },
      where,
      orderBy: {
        name: "asc",
      },
    });

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
