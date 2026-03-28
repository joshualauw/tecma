"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import bcrypt from "bcryptjs";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

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

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = createEmployeeSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      roleId: formData.get("roleId"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    const { name, email, password, roleId, phoneNumber, address } = parsed;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId,
        },
      });
      await tx.employees.create({
        data: {
          userId: createdUser.id,
          phoneNumber,
          address,
          createdBy: user.id,
        },
      });
    });

    await createAndSendNotification(user.id, `Employee ${name} created`);

    return { success: true, message: "Employee created successfully" };
  } catch (error) {
    const response = handleError("createEmployeeAction", error);
    return { success: false, message: response.message };
  }
}
