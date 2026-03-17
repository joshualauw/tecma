"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeletePermissionActionResponse = ApiResponse<null>;

export async function deletePermissionAction(id: number): Promise<DeletePermissionActionResponse> {
  try {
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
