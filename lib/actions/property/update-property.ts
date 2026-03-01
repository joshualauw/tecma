"use server";

import { prisma } from "@/lib/prisma";

export async function updatePropertyAction(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const address = formData.get("address");

  const propertyId = Number(id);
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

    await prisma.properties.update({
      where: {
        id: propertyId,
      },
      data: {
        name: name as string,
        address: address as string,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating property:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
