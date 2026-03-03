"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteEmployeeActionResponse = ApiResponse<null>;

export async function deleteEmployeeAction(employeeId: number): Promise<DeleteEmployeeActionResponse> {
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return { success: false, message: "Invalid employee id" };
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
      return { success: false, message: "Employee not found" };
    }

    await prisma.employees.delete({
      where: {
        id: employeeId,
      },
    });

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
