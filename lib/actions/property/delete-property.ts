"use server";

import { prisma } from "@/lib/prisma";

export async function deletePropertyAction(propertyId: number) {
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { success: false, error: "Invalid property id" };
  }

  try {
    const existingProperty = await prisma.properties.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProperty) {
      return { success: false, error: "Property not found" };
    }

    await prisma.properties.delete({
      where: {
        id: propertyId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting property:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
