"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteUnitActionResponse = ApiResponse<null>;

export async function deleteUnitAction(unitId: number): Promise<DeleteUnitActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "units:delete")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = deleteUnitSchema.safeParse({ id: unitId });

  if (!parsed.success) {
    console.error("Delete Unit validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id } = parsed.data;

  const unit = await prisma.units.findUnique({
    where: { id },
    select: { propertyId: true },
  });
  if (!unit) {
    return { success: false, message: "Unit not found" };
  }
  if (!userCanAccessProperty(user, unit.propertyId)) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  try {
    await prisma.units.delete({
      where: { id },
    });

    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    console.error("Error deleting unit:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Unit not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
