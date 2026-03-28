"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const updateEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.email().trim().min(1),
  roleId: z.coerce.number().int().positive(),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().nullable(),
});

type UpdateEmployeeActionResponse = ApiResponse<null>;

export async function updateEmployeeAction(formData: FormData): Promise<UpdateEmployeeActionResponse> {
  try {
    const session = await auth();

    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = updateEmployeeSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    const { id, name, email, roleId, phoneNumber, address } = parsed;

    const employeeUser = await prisma.employees.findFirstOrThrow({
      where: { id },
      select: {
        userId: true,
      },
    });

    if (employeeUser.userId === user.id) {
      throw new Error("You cannot update your own employee details");
    }

    await prisma.$transaction(async (tx) => {
      const employee = await tx.employees.update({
        where: { id },
        data: {
          phoneNumber,
          address,
          updatedBy: user.id,
        },
      });

      await tx.users.update({
        where: { id: employee.userId },
        data: { name, email, roleId, updatedBy: user.id },
      });
    });

    await createAndSendNotification(user.id, `Employee ${name} updated`);

    return { success: true, message: "Employee updated successfully" };
  } catch (error) {
    const response = handleError("updateEmployeeAction", error);
    return { success: false, message: response.message };
  }
}
