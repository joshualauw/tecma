"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

type DeletePermissionActionResponse = ApiResponse<null>;

export async function deletePermissionAction(id: number): Promise<DeletePermissionActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    await prisma.$transaction(async (tx) => {
      const permission = await tx.employeePermissions.delete({
        where: { id },
        select: { employeeId: true, propertyId: true },
      });

      await tx.ticketAssignments.deleteMany({
        where: {
          employeeId: permission.employeeId,
          ticket: {
            propertyId: permission.propertyId,
          },
        },
      });
    });

    return { success: true, message: "Permission deleted successfully" };
  } catch (error) {
    const response = handleError("deletePermissionAction", error);
    return { success: false, message: response.message };
  }
}
