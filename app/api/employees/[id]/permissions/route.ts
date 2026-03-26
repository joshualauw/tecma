import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit-mapper";

export type EmployeePermissionApiItem = BaseApiData & {
  property: {
    id: number;
    name: string;
  };
};

export type EmployeePermissionsApiData = {
  permissions: EmployeePermissionApiItem[];
};

const employeePermissionsQuery = z.object({
  id: z.coerce.number().int().positive(),
});

export type EmployeePermissionsApiResponse = ApiResponse<EmployeePermissionsApiData>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<EmployeePermissionsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || user.role !== "super-admin") {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const contextParams = await context.params;
    const parsed = employeePermissionsQuery.safeParse({ id: contextParams.id });

    if (!parsed.success) {
      console.error("Employee permissions query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { id: employeeId } = parsed.data;

    const rows = await prisma.employeePermissions.findMany({
      where: { employeeId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const permissions: EmployeePermissionApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: { permissions },
      message: "Employee permissions fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching employee permissions:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching employee permissions",
        success: false,
      },
      { status: 500 },
    );
  }
}
