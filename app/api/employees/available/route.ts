import { prisma } from "@/lib/db/prisma";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { AuthorizationError, handleError } from "@/lib/errors";

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

    if (!user || !hasPermissions(user, "tickets:create", "tickets:edit")) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);
    const parsed = availableEmployeesQuery.parse({
      propertyId: searchParams.get("propertyId"),
    });

    const { propertyId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

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
      orderBy: {
        createdAt: "desc",
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
    const response = handleError("GET /api/employees/available", error);
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
