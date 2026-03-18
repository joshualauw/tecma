"use server";

import { LeaseStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateLeaseSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum([LeaseStatus.active, LeaseStatus.expired, LeaseStatus.terminated]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type UpdateLeaseActionResponse = ApiResponse<null>;

export async function updateLeaseAction(formData: FormData): Promise<UpdateLeaseActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "tenants:leases:edit")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = updateLeaseSchema.safeParse({
    id: formData.get("id"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    console.error("Update Lease validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, startDate, endDate, status } = parsed.data;

  try {
    const lease = await prisma.leases.findUnique({
      where: { id },
      select: { tenantId: true, unitId: true, status: true, propertyId: true },
    });
    if (!lease) {
      return { success: false, message: "Lease not found" };
    }
    if (!userCanAccessProperty(user, lease.propertyId)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const existingActive = await prisma.leases.findFirst({
      where: { tenantId: lease.tenantId, unitId: lease.unitId, status: LeaseStatus.active },
      select: { id: true },
    });
    if (existingActive && status === LeaseStatus.active) {
      return { success: false, message: "This tenant already has an active lease for the selected unit." };
    }

    await prisma.leases.update({
      where: { id },
      data: { startDate, endDate, status },
    });

    return { success: true, message: "Lease updated successfully" };
  } catch (error) {
    console.error("Error updating lease:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Lease not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
