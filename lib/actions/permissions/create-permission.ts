"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createPermissionSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  propertyId: z.coerce.number().int().positive(),
});

type CreatePermissionActionResponse = ApiResponse<null>;

export async function createPermissionAction(formData: FormData): Promise<CreatePermissionActionResponse> {
  const parsed = createPermissionSchema.safeParse({
    employeeId: formData.get("employeeId"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Permission validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { employeeId, propertyId } = parsed.data;

  try {
    const existingPermission = await prisma.employeePermissions.findFirst({
      where: { employeeId, propertyId },
    });
    if (existingPermission) {
      return { success: false, message: "This employee already has permission for this property" };
    }

    await prisma.employeePermissions.create({
      data: {
        employeeId,
        propertyId,
      },
    });

    return { success: true, message: "Permission created successfully" };
  } catch (error) {
    console.error("Error creating permission:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const match = error.message.match(/fields: \((.*?)\)/);
      const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
      return { success: false, message: `Permission with this ${fieldName} already exists` };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
