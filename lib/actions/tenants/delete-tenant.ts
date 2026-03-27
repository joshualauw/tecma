"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

const deleteTenantSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTenantActionResponse = ApiResponse<null>;

export async function deleteTenantAction(tenantId: number): Promise<DeleteTenantActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants:delete")) throw new AuthorizationError();

    const parsed = deleteTenantSchema.parse({ id: tenantId });

    const { id } = parsed;

    const tenant = await prisma.tenants.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    if (!userCanAccessProperty(user, tenant.propertyId)) throw new AuthorizationError();

    await prisma.tenants.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Tenant deleted successfully" };
  } catch (error) {
    const response = handleError("deleteTenantAction", error);
    return { success: false, message: response.message };
  }
}
