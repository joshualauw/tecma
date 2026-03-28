"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

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

    const targetUser = await prisma.employees.findUnique({
      where: { id },
      select: { user: { select: { name: true } } },
    });
    if (!targetUser) {
      throw new Error("Employee not found");
    }

    await prisma.$transaction(async (tx) => {
      const employee = await tx.employees.delete({
        where: { id },
      });
      await tx.users.delete({
        where: { id: employee.userId },
      });
    });

    await notifySystemAction(user.id, `Employee ${targetUser.user.name} deleted`);

    return { success: true, message: "Employee deleted successfully" };
  } catch (error) {
    const response = handleError("deleteEmployeeAction", error);
    return { success: false, message: response.message };
  }
}
