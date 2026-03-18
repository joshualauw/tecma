"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteEmployeeActionResponse = ApiResponse<null>;

export async function deleteEmployeeAction(employeeId: number): Promise<DeleteEmployeeActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || user.role !== "super-admin") {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = deleteEmployeeSchema.safeParse({ id: employeeId });

  if (!parsed.success) {
    console.error("Delete Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id } = parsed.data;

  const thisEmployee = await prisma.employees.findFirstOrThrow({
    where: { userId: user.id },
  });

  if (thisEmployee.id === id) {
    return { success: false, message: "You cannot delete your own employee account" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const employee = await tx.employees.delete({
        where: { id },
      });
      await tx.users.delete({
        where: { id: employee.userId },
      });
    });

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    console.error("Error deleting employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Employee not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
