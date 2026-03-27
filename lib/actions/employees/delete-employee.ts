"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

const deleteEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteEmployeeActionResponse = ApiResponse<null>;

export async function deleteEmployeeAction(employeeId: number): Promise<DeleteEmployeeActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = deleteEmployeeSchema.parse({ id: employeeId });

    const { id } = parsed;

    const thisEmployee = await prisma.employees.findFirstOrThrow({
      where: { userId: user.id },
    });

    if (thisEmployee.id === id) {
      throw new Error("You cannot delete your own employee account");
    }

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
    const response = handleError("deleteEmployeeAction", error);
    return { success: false, message: response.message };
  }
}
