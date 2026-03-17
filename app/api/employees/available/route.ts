import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";

export type AvailableEmployeeApiItem = {
  id: number;
  name: string;
};

export type AvailableEmployeesApiData = {
  employees: AvailableEmployeeApiItem[];
};

const availableEmployeesQuery = z.object({
  propertyId: z.coerce.number().int().positive(),
});

export type AvailableEmployeesApiResponse = ApiResponse<AvailableEmployeesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<AvailableEmployeesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!hasPermissions(user, "tickets:create", "tickets:edit")) {
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
    const parsed = availableEmployeesQuery.safeParse({
      propertyId: searchParams.get("propertyId"),
    });

    if (!parsed.success) {
      console.error("Available employees query validation failed:", parsed.error);
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

    const rows = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        employee: {
          select: {
            id: true,
          },
        },
      },
      where: {
        employee: {
          employeePermissions: {
            some: {
              propertyId,
            },
          },
        },
        role: {
          rolePermissions: {
            some: {
              permission: {
                name: "tickets:assigned",
              },
            },
          },
        },
      },
    });

    const employees = rows
      .filter((row) => row.employee !== null)
      .map((row) => ({
        id: row.employee!.id,
        name: row.name,
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
