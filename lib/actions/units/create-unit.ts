"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const createUnitSchema = z.object({
  code: z.string().trim().min(1),
  propertyId: z.coerce.number().int().positive(),
});

type CreateUnitActionResponse = ApiResponse<null>;

export async function createUnitAction(formData: FormData): Promise<CreateUnitActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "units:create")) throw new AuthorizationError();

    const parsed = createUnitSchema.parse({
      code: formData.get("code"),
      propertyId: formData.get("propertyId"),
    });

    const { code, propertyId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    await prisma.units.create({
      data: { code, propertyId, createdBy: user.id },
    });

    await notifySystemAction(user.id, `Unit ${code} created`, propertyId, "units:view");

    return { success: true, message: "Unit created successfully" };
  } catch (error) {
    const response = handleError("createUnitAction", error);
    return { success: false, message: response.message };
  }
}
