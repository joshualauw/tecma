"use server";

import { Prisma } from "@/generated/prisma/client";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX)
    .trim()
    .min(1),
  address: z.string().optional(),
  propertyId: z.coerce.number().int().positive(),
});

type UpdateEmployeeActionResponse = ApiResponse<null>;

export async function updateEmployeeAction(formData: FormData): Promise<UpdateEmployeeActionResponse> {
  const parsed = updateEmployeeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Update Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, name, phoneNumber, address, propertyId } = parsed.data;

  try {
    await prisma.employees.update({
      where: { id },
      data: { name, phoneNumber, address, propertyId },
    });

    return { success: true, message: "Employee updated successfully" };
  } catch (error) {
    console.error("Error updating employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "Employee not found" };
      } else if (error.code === "P2002") {
        return { success: false, message: "Employee with this phone number already exists" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
