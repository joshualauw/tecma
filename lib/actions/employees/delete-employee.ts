"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteEmployeeActionResponse = ApiResponse<null>;

export async function deleteEmployeeAction(employeeId: number): Promise<DeleteEmployeeActionResponse> {
  const parsed = deleteEmployeeSchema.safeParse({ id: employeeId });

  if (!parsed.success) {
    console.error("Delete Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid employee ID" };
  }

  const { id } = parsed.data;

  try {
    await prisma.employees.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
