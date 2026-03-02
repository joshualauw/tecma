"use server";

import { prisma } from "@/lib/prisma";

export async function deleteEmployeeAction(employeeId: number) {
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { success: false, error: "Invalid employee id" };
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

    await prisma.employees.delete({
      where: {
        id: employeeId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
