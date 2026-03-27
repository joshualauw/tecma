"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

const updateUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
  code: z.string().trim().min(1),
});

type UpdateUnitActionResponse = ApiResponse<null>;

export async function updateUnitAction(formData: FormData): Promise<UpdateUnitActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "units:edit")) throw new AuthorizationError();

    const parsed = updateUnitSchema.parse({
      id: formData.get("id"),
      code: formData.get("code"),
    });

    const { id, code } = parsed;

    const unit = await prisma.units.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!unit) {
      throw new Error("Unit not found");
    }
    if (!userCanAccessProperty(user, unit.propertyId)) throw new AuthorizationError();

    await prisma.units.update({
      where: { id },
      data: { code, updatedBy: user.id },
    });

    return { success: true, message: "Unit updated successfully" };
  } catch (error) {
    const response = handleError("updateUnitAction", error);
    return { success: false, message: response.message };
  }
}
