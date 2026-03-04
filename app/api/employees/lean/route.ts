import { EmployeesWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type LeanEmployeeApiItem = {
  id: number;
  name: string;
};

export type LeanEmployeesApiData = {
  employees: LeanEmployeeApiItem[];
};

export type LeanEmployeesApiResponse = ApiResponse<LeanEmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<LeanEmployeesApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const propertyIdRaw = searchParams.get("propertyId");

    const isPropertyIdNull = propertyIdRaw === null || propertyIdRaw.trim() === "" || propertyIdRaw === "null";
    const propertyIdParam = Number(propertyIdRaw);
    const propertyId =
      !isPropertyIdNull && Number.isFinite(propertyIdParam) && Number.isInteger(propertyIdParam) && propertyIdParam > 0
        ? propertyIdParam
        : null;

    const where: EmployeesWhereInput = {};

    if (propertyId !== null) {
      where.property_id = propertyId;
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
