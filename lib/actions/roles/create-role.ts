"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  permissions: z.array(z.string().trim().min(1)).default([]),
});

type CreateRoleActionResponse = ApiResponse<null>;

export async function createRoleAction(formData: FormData): Promise<CreateRoleActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = createRoleSchema.parse({
      name: formData.get("name"),
      permissions: formData.getAll("permissions"),
    });

    const { name, permissions } = parsed;

    if (name == "super-admin") {
      throw new Error("Role name is reserved");
    }

    await prisma.role.create({
      data: {
        name,
        rolePermissions: {
          create: permissions.map((permission) => ({ permission: { connect: { name: permission } } })),
        },
        createdBy: user.id,
      },
    });

    await createAndSendNotification(user.id, `Role ${name} created`, null);

    return { success: true, message: "Role created successfully" };
  } catch (error) {
    const response = handleError("createRoleAction", error);
    return { success: false, message: response.message };
  }
}
