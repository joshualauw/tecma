"use server";

import { LeaseStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const createLeaseSchema = z
  .object({
    unitId: z.coerce.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    tenantId: z.coerce.number().int().positive(),
    propertyId: z.coerce.number().int().positive(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type CreateLeaseActionResponse = ApiResponse<null>;

export async function createLeaseAction(formData: FormData): Promise<CreateLeaseActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants-leases:create")) throw new AuthorizationError();

    const parsed = createLeaseSchema.parse({
      unitId: formData.get("unitId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      tenantId: formData.get("tenantId"),
      propertyId: formData.get("propertyId"),
    });

    const { unitId, startDate, endDate, tenantId, propertyId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    const existingActive = await prisma.leases.findFirst({
      where: { tenantId, unitId, status: LeaseStatus.active },
      select: { id: true },
    });
    if (existingActive) {
      throw new Error("This tenant already has an active lease for the selected unit.");
    }

    const lease = await prisma.leases.create({
      data: {
        unitId,
        startDate,
        endDate,
        tenantId,
        propertyId,
        createdBy: user.id,
      },
      include: {
        tenant: true,
      },
    });

    await notifySystemAction(user.id, `Lease for ${lease.tenant.name} created`, propertyId, "tenants-leases:view");

    return { success: true, message: "Lease created successfully" };
  } catch (error) {
    const response = handleError("createLeaseAction", error);
    return { success: false, message: response.message };
  }
}
