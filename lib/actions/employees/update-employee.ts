"use server";

import { prisma } from "@/lib/prisma";

export async function updateEmployeeAction(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");

  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { success: false, error: "Invalid employee id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, error: "Invalid property id" };
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
      return { success: false, error: "Employee not found" };
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

    return { success: true };
  } catch (error) {
    console.error("Error updating employee:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
