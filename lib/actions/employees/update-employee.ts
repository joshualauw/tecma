"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdateEmployeeActionResponse = ApiResponse<null>;

export async function updateEmployeeAction(formData: FormData): Promise<UpdateEmployeeActionResponse> {
  const id = formData.get("id");
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");

  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { success: false, message: "Invalid employee id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
  }

  try {
    const existingEmployee = await prisma.employees.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
      },
    });

    if (!existingEmployee) {
      return { data: null, success: false, message: "Employee not found" };
    }

    await prisma.employees.update({
      where: {
        id: employeeId,
      },
      data: {
        name: name as string,
        phone_number: phoneNumber as string,
        address: (address as string) || null,
        property_id: parsedPropertyId,
      },
    });

    return { success: true, message: "Employee updated successfully" };
  } catch (error) {
    console.error("Error updating employee:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
