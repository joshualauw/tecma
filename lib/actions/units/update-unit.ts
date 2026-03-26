"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
  code: z.string().trim().min(1),
});

type UpdateUnitActionResponse = ApiResponse<null>;

export async function updateUnitAction(formData: FormData): Promise<UpdateUnitActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "units:edit")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = updateUnitSchema.safeParse({
      id: formData.get("id"),
      code: formData.get("code"),
    });

    if (!parsed.success) {
      console.error("Update Unit validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id, code } = parsed.data;

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

    await prisma.units.update({
      where: { id },
      data: { code, updatedBy: user.id },
    });

    return { success: true, message: "Unit updated successfully" };
  } catch (error) {
    console.error("Error updating unit:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Unit not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
