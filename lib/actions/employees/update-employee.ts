"use server";

import { Prisma } from "@/generated/prisma/client";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";

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

    if (!isSuperAdmin(user)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = updateEmployeeSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    if (!parsed.success) {
      console.error("Update Employee validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id, name, email, roleId, phoneNumber, address } = parsed.data;

    const employeeUser = await prisma.users.findFirstOrThrow({
      where: { id },
    });

    if (employeeUser.id === user!.id) {
      return { success: false, message: "You cannot update your own employee details" };
    }

    await prisma.$transaction(async (tx) => {
      const employee = await tx.employees.update({
        where: { id },
        data: {
          phoneNumber,
          address,
        },
      });

      await tx.users.update({
        where: { id: employee.userId },
        data: { name, email, roleId },
      });
    });

    return { success: true, message: "Employee updated successfully" };
  } catch (error) {
    console.error("Error updating employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "Employee not found" };
      }
      if (error.code === "P2002") {
        const match = error.message.match(/fields: \((.*?)\)/);
        const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
        return { success: false, message: `Employee with this ${fieldName} already exists` };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
