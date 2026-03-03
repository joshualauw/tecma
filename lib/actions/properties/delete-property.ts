"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeletePropertyActionResponse = ApiResponse<null>;

export async function deletePropertyAction(propertyId: number): Promise<DeletePropertyActionResponse> {
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { success: false, message: "Invalid property id" };
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
      return { success: false, message: "Property not found" };
    }

    await prisma.properties.delete({
      where: {
        id: propertyId,
      },
    });

    return { success: true, message: "Property deleted successfully" };
  } catch (error) {
    console.error("Error deleting property:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
