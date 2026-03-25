"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import bcrypt from "bcryptjs";
import z from "zod";

const createEmployeeSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim().min(1),
  password: z.string().min(6),
  roleId: z.coerce.number().int().positive(),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().nullable(),
});

type CreateEmployeeActionResponse = ApiResponse<null>;

export async function createEmployeeAction(formData: FormData): Promise<CreateEmployeeActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || user.role !== "super-admin") {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = createEmployeeSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      roleId: formData.get("roleId"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    if (!parsed.success) {
      console.error("Create Employee validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { name, email, password, roleId, phoneNumber, address } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId,
        },
      });
      await tx.employees.create({
        data: {
          userId: user.id,
          phoneNumber,
          address,
        },
      });
    });

    return { success: true, message: "Employee created successfully" };
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const match = error.message.match(/fields: \((.*?)\)/);
      const fieldName = match ? match[1].replace(/[`"]/g, "") : "field";
      return { success: false, message: `Employee with this ${fieldName} already exists` };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
