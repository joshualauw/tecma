"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateTenantSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().trim().min(1).nullable(),
});

type UpdateTenantActionResponse = ApiResponse<null>;

export async function updateTenantAction(formData: FormData): Promise<UpdateTenantActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants:edit")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = updateTenantSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    if (!parsed.success) {
      console.error("Update Tenant validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id, name, phoneNumber, address } = parsed.data;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!tenant) {
      return { success: false, message: "Tenant not found" };
    }
    if (!userCanAccessProperty(user, tenant.propertyId)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    await prisma.tenants.update({
      where: { id },
      data: { name, phoneNumber, address, updatedBy: user.id },
    });

    return { success: true, message: "Tenant updated successfully" };
  } catch (error) {
    console.error("Error updating tenant:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "Tenant not found" };
      } else if (error.code === "P2002") {
        const match = error.message.match(/fields: \((.*?)\)/);
        const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
        return { success: false, message: `Tenant with this ${fieldName} already exists` };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
