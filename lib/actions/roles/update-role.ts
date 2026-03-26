"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";

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

    if (!isSuperAdmin(user)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = updateRoleSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      permissions: formData.getAll("permissions"),
    });

    if (!parsed.success) {
      console.error("Update Role validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id, name, permissions } = parsed.data;

    if (name == "super-admin") {
      return { success: false, message: "Role name is reserved" };
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
      },
    });

    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    console.error("Error updating role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Role not found" };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Role name already exists" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
