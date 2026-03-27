"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

const deleteRoleSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteRoleActionResponse = ApiResponse<null>;

export async function deleteRoleAction(roleId: number): Promise<DeleteRoleActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = deleteRoleSchema.parse({ id: roleId });

    const { id } = parsed;

    await prisma.role.delete({
      where: { id },
    });

    return { success: true, message: "Role deleted successfully" };
  } catch (error) {
    const response = handleError("deleteRoleAction", error);
    return { success: false, message: response.message };
  }
}
