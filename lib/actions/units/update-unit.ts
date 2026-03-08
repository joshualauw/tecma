"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateUnitSchema = z.object({
  id: z.coerce.number().int().positive(),
  code: z.string().trim().min(1),
  propertyId: z.coerce.number().int().positive(),
});

type UpdateUnitActionResponse = ApiResponse<null>;

export async function updateUnitAction(formData: FormData): Promise<UpdateUnitActionResponse> {
  const parsed = updateUnitSchema.safeParse({
    id: formData.get("id"),
    code: formData.get("code"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Update Unit validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, code, propertyId } = parsed.data;

  try {
    await prisma.units.update({
      where: {
        id,
      },
      data: {
        code: code,
        property_id: propertyId,
      },
    });

    return { success: true, message: "Unit updated successfully" };
  } catch (error) {
    console.error("Error updating unit:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Unit not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
