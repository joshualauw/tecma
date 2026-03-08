"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateTenantSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .trim()
    .min(1),
  address: z.string().trim().min(1).nullable(),
  propertyId: z.coerce.number().int().positive(),
  unitId: z.coerce.number().int().positive(),
});

type UpdateTenantActionResponse = ApiResponse<null>;

export async function updateTenantAction(formData: FormData): Promise<UpdateTenantActionResponse> {
  const parsed = updateTenantSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId"),
  });

  if (!parsed.success) {
    console.error("Update Tenant validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, name, phoneNumber, address, propertyId, unitId } = parsed.data;

  try {
    const availableUnit = await prisma.units.findFirst({
      where: {
        id: unitId,
        property_id: propertyId,
        OR: [
          {
            tenants: {
              none: {},
            },
          },
          {
            id: unitId ?? -1,
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
        id,
      },
      data: {
        name: name,
        phone_number: phoneNumber as string,
        address: address,
        property_id: propertyId,
        unit_id: unitId,
      },
    });

    return { success: true, message: "Tenant updated successfully" };
  } catch (error) {
    console.error("Error updating tenant:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "Tenant not found" };
      } else if (error.code === "P2002") {
        return { success: false, message: "Tenant with this phone number already exists" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
