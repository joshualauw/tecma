"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdatePropertyActionResponse = ApiResponse<null>;

export async function updatePropertyAction(formData: FormData): Promise<UpdatePropertyActionResponse> {
  const id = formData.get("id");
  const name = formData.get("name");
  const address = formData.get("address");

  const propertyId = Number(id);
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

    await prisma.properties.update({
      where: {
        id: propertyId,
      },
      data: {
        name: name as string,
        address: address as string,
      },
    });

    return { success: true, message: "Property updated successfully" };
  } catch (error) {
    console.error("Error updating property:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
