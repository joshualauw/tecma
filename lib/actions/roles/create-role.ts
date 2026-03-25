"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  permissions: z.array(z.string().trim().min(1)).default([]),
});

type CreateRoleActionResponse = ApiResponse<null>;

export async function createRoleAction(formData: FormData): Promise<CreateRoleActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || user.role !== "super-admin") {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = createRoleSchema.safeParse({
      name: formData.get("name"),
      permissions: formData.getAll("permissions"),
    });

    if (!parsed.success) {
      console.error("Create Role validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { name, permissions } = parsed.data;

    if (name == "super-admin") {
      return { success: false, message: "Role name is reserved" };
    }

    await prisma.role.create({
      data: {
        name,
        rolePermissions: {
          create: permissions.map((permission) => ({ permission: { connect: { name: permission } } })),
        },
      },
    });

    return { success: true, message: "Role created successfully" };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
