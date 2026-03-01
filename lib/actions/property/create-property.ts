"use server";

import { prisma } from "@/lib/prisma";

export async function createPropertyAction(formData: FormData) {
  const name = formData.get("name");
  const address = formData.get("address");

  try {
    await prisma.properties.create({
      data: {
        name: name as string,
        address: address as string,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating property:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
