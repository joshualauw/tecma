"use server";

import { prisma } from "@/lib/prisma";

export async function createEmployeeAction(formData: FormData) {
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");

  try {
    await prisma.employees.create({
      data: {
        name: name as string,
        phone_number: phoneNumber as string,
        address: (address as string) || null,
        property_id: Number(propertyId),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating employee:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
