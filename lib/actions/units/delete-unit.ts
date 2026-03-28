"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const deleteUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteUnitActionResponse = ApiResponse<null>;

export async function deleteUnitAction(unitId: number): Promise<DeleteUnitActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "units:delete")) throw new AuthorizationError();

    const parsed = deleteUnitSchema.parse({ id: unitId });

    const { id } = parsed;

    const unit = await prisma.units.findUnique({
      where: { id },
      select: { propertyId: true, code: true },
    });
    if (!unit) {
      throw new Error("Unit not found");
    }
    if (!userCanAccessProperty(user, unit.propertyId)) throw new AuthorizationError();

    await prisma.units.delete({
      where: { id },
    });

    await notifySystemAction(user.id, `Unit ${unit.code} deleted`, unit.propertyId, "units:view");

    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    const response = handleError("deleteUnitAction", error);
    return { success: false, message: response.message };
  }
}
