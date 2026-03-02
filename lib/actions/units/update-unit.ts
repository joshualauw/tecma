"use server";

import { prisma } from "@/lib/prisma";

export async function updateUnitAction(formData: FormData) {
  const id = formData.get("id");
  const code = formData.get("code");
  const propertyId = formData.get("propertyId");

  const unitId = Number(id);
  if (!Number.isInteger(unitId) || unitId <= 0) {
    return { success: false, error: "Invalid unit id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, error: "Invalid property id" };
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

    await prisma.units.update({
      where: {
        id: unitId,
      },
      data: {
        code: code as string,
        property_id: parsedPropertyId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating unit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
