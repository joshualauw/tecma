import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextResponse } from "next/server";
import z from "zod";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

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

    if (!user || user.role !== "super-admin") throw new AuthorizationError();

    const contextParams = await context.params;
    const parsed = employeePermissionsQuery.parse({ id: contextParams.id });
    const { id: employeeId } = parsed;

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
    const response = handleError("GET /api/employees/[id]/permissions", error);
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
