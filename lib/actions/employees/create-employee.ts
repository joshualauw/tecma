"use server";

import { Prisma, UserRole } from "@/generated/prisma/client";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import bcrypt from "bcryptjs";
import z from "zod";

const createEmployeeSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim().min(1),
  password: z.string().min(6),
  role: z.enum([UserRole.dispatcher, UserRole.worker]),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().nullable(),
  propertyId: z.coerce.number().int().positive(),
});

type CreateEmployeeActionResponse = ApiResponse<null>;

export async function createEmployeeAction(formData: FormData): Promise<CreateEmployeeActionResponse> {
  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Employee validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { name, email, password, role, phoneNumber, address, propertyId } = parsed.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });
      await tx.employees.create({
        data: {
          userId: user.id,
          propertyId,
          phoneNumber,
          address,
        },
      });
    });

    return { success: true, message: "Employee created successfully" };
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "A user with this email already exists" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
