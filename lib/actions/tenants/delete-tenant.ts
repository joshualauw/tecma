"use server";

import { prisma } from "@/lib/prisma";

export async function deleteTenantAction(tenantId: number) {
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return { success: false, error: "Invalid tenant id" };
  }

  try {
    const existingTenant = await prisma.tenants.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!existingTenant) {
      return { success: false, error: "Tenant not found" };
    }

    await prisma.tenants.delete({
      where: {
        id: tenantId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
