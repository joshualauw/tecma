"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteTenantActionResponse = ApiResponse<null>;

export async function deleteTenantAction(tenantId: number): Promise<DeleteTenantActionResponse> {
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return { success: false, message: "Invalid tenant id" };
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
      return { success: false, message: "Tenant not found" };
    }

    await prisma.tenants.delete({
      where: {
        id: tenantId,
      },
    });

    return { success: true, message: "Tenant deleted successfully" };
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
