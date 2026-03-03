"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteUnitActionResponse = ApiResponse<null>;

export async function deleteUnitAction(unitId: number): Promise<DeleteUnitActionResponse> {
  if (!Number.isInteger(unitId) || unitId <= 0) {
    return { success: false, message: "Invalid unit id" };
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
      return { success: false, message: "Unit not found" };
    }

    await prisma.units.delete({
      where: {
        id: unitId,
      },
    });

    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    console.error("Error deleting unit:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
