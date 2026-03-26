"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteTenantSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTenantActionResponse = ApiResponse<null>;

export async function deleteTenantAction(tenantId: number): Promise<DeleteTenantActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants:delete")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = deleteTenantSchema.safeParse({ id: tenantId });

    if (!parsed.success) {
      console.error("Delete Tenant validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id } = parsed.data;

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

    await prisma.tenants.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Tenant deleted successfully" };
  } catch (error) {
    console.error("Error deleting tenant:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Tenant not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
