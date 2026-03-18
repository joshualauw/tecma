"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeletePermissionActionResponse = ApiResponse<null>;

export async function deletePermissionAction(id: number): Promise<DeletePermissionActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || user.role !== "super-admin") {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    await prisma.$transaction(async (tx) => {
      const { employeeId } = await tx.employeePermissions.delete({
        where: { id },
        select: { employeeId: true },
      });

      await tx.tickets.updateMany({
        where: {
          employeeId,
        },
        data: { employeeId: null },
      });
    });

    return { success: true, message: "Permission deleted successfully" };
  } catch (error) {
    console.error("Error deleting permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Permission not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
