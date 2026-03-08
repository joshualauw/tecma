"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteTenantSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTenantActionResponse = ApiResponse<null>;

export async function deleteTenantAction(tenantId: number): Promise<DeleteTenantActionResponse> {
  const parsed = deleteTenantSchema.safeParse({ id: tenantId });

  if (!parsed.success) {
    console.error("Delete Tenant validation failed:", parsed.error);
    return { success: false, message: "Invalid tenant ID" };
  }

  const { id } = parsed.data;

  try {
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
