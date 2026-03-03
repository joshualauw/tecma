"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdateTenantActionResponse = ApiResponse<null>;

export async function updateTenantAction(formData: FormData): Promise<UpdateTenantActionResponse> {
  const id = formData.get("id");
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");
  const unitId = formData.get("unitId");

  const tenantId = Number(id);
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return { success: false, message: "Invalid tenant id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
  }

  const parsedUnitId = Number(unitId);
  if (!Number.isInteger(parsedUnitId) || parsedUnitId <= 0) {
    return { success: false, message: "Invalid unit id" };
  }

  try {
    const existingTenant = await prisma.tenants.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        unit_id: true,
      },
    });

    if (!existingTenant) {
      return { success: false, message: "Tenant not found" };
    }

    const availableUnit = await prisma.units.findFirst({
      where: {
        id: parsedUnitId,
        property_id: parsedPropertyId,
        OR: [
          {
            tenants: {
              none: {},
            },
          },
          {
            id: existingTenant.unit_id ?? -1,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!availableUnit) {
      return { success: false, message: "Selected unit is not available" };
    }

    await prisma.tenants.update({
      where: {
        id: tenantId,
      },
      data: {
        name: name as string,
        phone_number: phoneNumber as string,
        address: (address as string) || null,
        property_id: parsedPropertyId,
        unit_id: parsedUnitId,
      },
    });

    return { success: true, message: "Tenant updated successfully" };
  } catch (error) {
    console.error("Error updating tenant:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
