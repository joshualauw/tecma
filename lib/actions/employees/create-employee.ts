"use server";

import { Prisma } from "@/generated/prisma/client";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createEmployeeSchema = z.object({
  name: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX)
    .trim()
    .min(1),
  address: z.string().optional(),
  propertyId: z.coerce.number().int().positive(),
});

type CreateEmployeeActionResponse = ApiResponse<null>;

export async function createEmployeeAction(formData: FormData): Promise<CreateEmployeeActionResponse> {
  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { name, phoneNumber, address, propertyId } = parsed.data;

  try {
    await prisma.employees.create({
      data: { name, phoneNumber, address, propertyId },
    });

    return { success: true, message: "Employee created successfully" };
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, message: "Employee with this phone number already exists" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
