"use server";

import { prisma } from "@/lib/prisma";

export async function updateTenantAction(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");

  const tenantId = Number(id);
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return { success: false, error: "Invalid tenant id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, error: "Invalid property id" };
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

    await prisma.tenants.update({
      where: {
        id: tenantId,
      },
      data: {
        name: name as string,
        phone_number: phoneNumber as string,
        address: (address as string) || null,
        property_id: parsedPropertyId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating tenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
