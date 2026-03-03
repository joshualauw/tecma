"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateEmployeeActionResponse = ApiResponse<null>;

export async function createEmployeeAction(formData: FormData): Promise<CreateEmployeeActionResponse> {
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

    return { success: true, message: "Employee created successfully" };
  } catch (error) {
    console.error("Error creating employee:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
