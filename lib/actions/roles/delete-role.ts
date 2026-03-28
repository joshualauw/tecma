"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

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

    const role = await prisma.role.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    await prisma.role.delete({
      where: { id },
    });

    await notifySystemAction(user.id, `Role ${role.name} deleted`, null);

    return { success: true, message: "Role deleted successfully" };
  } catch (error) {
    const response = handleError("deleteRoleAction", error);
    return { success: false, message: response.message };
  }
}
