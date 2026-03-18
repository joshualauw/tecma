"use server";

import { LeaseStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

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
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "tenants-leases:create")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = createLeaseSchema.safeParse({
    unitId: formData.get("unitId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    tenantId: formData.get("tenantId"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Lease validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { unitId, startDate, endDate, tenantId, propertyId } = parsed.data;

  if (!userCanAccessProperty(user, propertyId)) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const [tenant, unit] = await Promise.all([
    prisma.tenants.findFirst({ where: { id: tenantId, propertyId }, select: { id: true } }),
    prisma.units.findFirst({ where: { id: unitId, propertyId }, select: { id: true } }),
  ]);
  if (!tenant || !unit) {
    return { success: false, message: "Tenant or unit does not belong to the selected property" };
  }

  try {
    const existingActive = await prisma.leases.findFirst({
      where: { tenantId, unitId, status: LeaseStatus.active },
      select: { id: true },
    });
    if (existingActive) {
      return { success: false, message: "This tenant already has an active lease for the selected unit." };
    }

    await prisma.leases.create({
      data: {
        unitId,
        startDate,
        endDate,
        tenantId,
        propertyId,
      },
    });

    return { success: true, message: "Lease created successfully" };
  } catch (error) {
    console.error("Error creating lease:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const match = error.message.match(/fields: \((.*?)\)/);
      const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
      return { success: false, message: `Lease with this ${fieldName} already exists` };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
