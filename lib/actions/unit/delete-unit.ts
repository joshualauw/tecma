"use server";

import { prisma } from "@/lib/prisma";

export async function deleteUnitAction(unitId: number) {
  if (!Number.isInteger(unitId) || unitId <= 0) {
    return { success: false, error: "Invalid unit id" };
  }

  try {
    const existingUnit = await prisma.units.findUnique({
      where: {
        id: unitId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUnit) {
      return { success: false, error: "Unit not found" };
    }

    await prisma.units.delete({
      where: {
        id: unitId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting unit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
