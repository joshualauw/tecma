import { prisma } from "@/lib/prisma";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";

export type AvailableEmployeeApiItem = {
  id: number;
  user: {
    name: string;
    role: {
      name: string;
    };
  };
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

    if (!user || !hasPermissions(user, "tickets:create", "tickets:edit")) {
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

    if (!userCanAccessProperty(user, propertyId)) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const employees = await prisma.employees.findMany({
      select: {
        id: true,
        user: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      where: {
        employeePermissions: {
          some: {
            propertyId,
          },
        },
        user: {
          role: {
            rolePermissions: {
              some: {
                permission: {
                  name: "tickets:view",
                },
              },
            },
          },
        },
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
