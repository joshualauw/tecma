"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const createPermissionSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive(),
});

type CreatePermissionActionResponse = ApiResponse<null>;

export async function createPermissionAction(formData: FormData): Promise<CreatePermissionActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = createPermissionSchema.parse({
      employeeId: formData.get("employeeId"),
      propertyId: formData.get("propertyId"),
    });

    const { employeeId, propertyId } = parsed;

    const existingPermission = await prisma.employeePermissions.findFirst({
      where: { employeeId, propertyId },
    });
    if (existingPermission) {
      throw new Error("This employee already has permission for this property");
    }

    const permission = await prisma.employeePermissions.create({
      data: {
        employeeId,
        propertyId,
        createdBy: user.id,
      },
      include: { employee: { include: { user: true } } },
    });

    await createAndSendNotification(user.id, `Permission for ${permission.employee.user.name} created`, null);

    return { success: true, message: "Permission created successfully" };
  } catch (error) {
    const response = handleError("createPermissionAction", error);
    return { success: false, message: response.message };
  }
}
