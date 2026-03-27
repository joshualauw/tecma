"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

const updateRoleSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  permissions: z.array(z.string().trim().min(1)).default([]),
});

type UpdateRoleActionResponse = ApiResponse<null>;

export async function updateRoleAction(formData: FormData): Promise<UpdateRoleActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = updateRoleSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      permissions: formData.getAll("permissions"),
    });

    const { id, name, permissions } = parsed;

    if (name == "super-admin") {
      throw new Error("Role name is reserved");
    }

    await prisma.role.update({
      where: { id },
      data: {
        name,
        rolePermissions: {
          deleteMany: {},
          create: permissions.map((permission) => ({
            permission: { connect: { name: permission } },
          })),
        },
        updatedBy: user.id,
      },
    });

    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    const response = handleError("updateRoleAction", error);
    return { success: false, message: response.message };
  }
}
