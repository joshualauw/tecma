"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

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

    if (!user || !hasPermissions(user, "tenants:edit")) throw new AuthorizationError();

    const parsed = updateTenantSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
    });

    const { id, name, phoneNumber, address } = parsed;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    if (!userCanAccessProperty(user, tenant.propertyId)) throw new AuthorizationError();

    await prisma.tenants.update({
      where: { id },
      data: { name, phoneNumber, address, updatedBy: user.id },
    });

    await notifySystemAction(user.id, `Tenant ${name} updated`, tenant.propertyId, "tenants:view");

    return { success: true, message: "Tenant updated successfully" };
  } catch (error) {
    const response = handleError("updateTenantAction", error);
    return { success: false, message: response.message };
  }
}
