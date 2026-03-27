"use server";

import { LeaseStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

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
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants-leases:edit")) throw new AuthorizationError();

    const parsed = updateLeaseSchema.parse({
      id: formData.get("id"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
    });

    const { id, startDate, endDate, status } = parsed;

    const lease = await prisma.leases.findUnique({
      where: { id },
      select: { tenantId: true, unitId: true, status: true, propertyId: true },
    });
    if (!lease) {
      throw new Error("Lease not found");
    }
    if (!userCanAccessProperty(user, lease.propertyId)) throw new AuthorizationError();

    const existingActive = await prisma.leases.findFirst({
      where: { tenantId: lease.tenantId, unitId: lease.unitId, status: LeaseStatus.active },
      select: { id: true },
    });
    if (existingActive && status === LeaseStatus.active && existingActive.id !== id) {
      throw new Error("This tenant already has an active lease for the selected unit.");
    }

    await prisma.leases.update({
      where: { id },
      data: { startDate, endDate, status, updatedBy: user.id },
    });

    return { success: true, message: "Lease updated successfully" };
  } catch (error) {
    const response = handleError("updateLeaseAction", error);
    return { success: false, message: response.message };
  }
}
