"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

type DeletePermissionActionResponse = ApiResponse<null>;

export async function deletePermissionAction(id: number): Promise<DeletePermissionActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const permission = await prisma.$transaction(async (tx) => {
      const permission = await tx.employeePermissions.delete({
        where: { id },
        select: { employee: { select: { id: true, user: { select: { name: true } } } }, propertyId: true },
      });

      await tx.ticketAssignments.deleteMany({
        where: {
          employeeId: permission.employee.id,
          ticket: {
            propertyId: permission.propertyId,
          },
        },
      });

      return permission;
    });

    await notifySystemAction(user.id, `Permission for ${permission.employee.user.name} deleted`, null);

    return { success: true, message: "Permission deleted successfully" };
  } catch (error) {
    const response = handleError("deletePermissionAction", error);
    return { success: false, message: response.message };
  }
}
