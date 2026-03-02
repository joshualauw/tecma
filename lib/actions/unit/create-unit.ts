"use server";

import { prisma } from "@/lib/prisma";

export async function createUnitAction(formData: FormData) {
  const code = formData.get("code");
  const propertyId = formData.get("propertyId");

  try {
    await prisma.units.create({
      data: {
        code: code as string,
        property_id: Number(propertyId),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating unit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
