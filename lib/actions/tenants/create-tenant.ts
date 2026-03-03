"use server";

import { prisma } from "@/lib/prisma";

export async function createTenantAction(formData: FormData) {
  const name = formData.get("name");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");
  const propertyId = formData.get("propertyId");
  const unitId = formData.get("unitId");

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, error: "Invalid property id" };
  }

  const parsedUnitId = Number(unitId);
  if (!Number.isInteger(parsedUnitId) || parsedUnitId <= 0) {
    return { success: false, error: "Invalid unit id" };
  }

  try {
    const availableUnit = await prisma.units.findFirst({
      where: {
        id: parsedUnitId,
        property_id: parsedPropertyId,
        tenants: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    if (!availableUnit) {
      return { success: false, error: "Selected unit is not available" };
    }

    await prisma.tenants.create({
      data: {
        name: name as string,
        phone_number: phoneNumber as string,
        address: (address as string) || null,
        property_id: parsedPropertyId,
        unit_id: parsedUnitId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating tenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
