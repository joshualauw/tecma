"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdateUnitActionResponse = ApiResponse<null>;

export async function updateUnitAction(formData: FormData): Promise<UpdateUnitActionResponse> {
  const id = formData.get("id");
  const code = formData.get("code");
  const propertyId = formData.get("propertyId");

  const unitId = Number(id);
  if (!Number.isInteger(unitId) || unitId <= 0) {
    return { success: false, message: "Invalid unit id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
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

    await prisma.units.update({
      where: {
        id: unitId,
      },
      data: {
        code: code as string,
        property_id: parsedPropertyId,
      },
    });

    return { success: true, message: "Unit updated successfully" };
  } catch (error) {
    console.error("Error updating unit:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
