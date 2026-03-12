"use server";

import { Prisma, UserRole } from "@/generated/prisma/client";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.email().trim().min(1),
  role: z.enum([UserRole.dispatcher, UserRole.worker]),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().nullable(),
  propertyId: z.coerce.number().int().positive(),
});

type UpdateEmployeeActionResponse = ApiResponse<null>;

export async function updateEmployeeAction(formData: FormData): Promise<UpdateEmployeeActionResponse> {
  const parsed = updateEmployeeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Update Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, name, email, role, phoneNumber, address, propertyId } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const employee = await tx.employees.update({
        where: { id },
        data: {
          phoneNumber,
          propertyId,
          address,
        },
      });
      await tx.users.update({
        where: { id: employee.userId },
        data: { name, email, role },
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
        return { success: false, message: "A user with this email already exists" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
