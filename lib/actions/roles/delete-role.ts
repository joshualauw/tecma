"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";

const deleteRoleSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteRoleActionResponse = ApiResponse<null>;

export async function deleteRoleAction(roleId: number): Promise<DeleteRoleActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!isSuperAdmin(user)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = deleteRoleSchema.safeParse({ id: roleId });

    if (!parsed.success) {
      console.error("Delete Role validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id } = parsed.data;

    await prisma.role.delete({
      where: { id },
    });

    return { success: true, message: "Role deleted successfully" };
  } catch (error) {
    console.error("Error deleting role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "Role not found" };
      }
      if (error.code === "P2003") {
        return { success: false, message: "Role is assigned to users and cannot be deleted" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
