"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createUnitSchema = z.object({
  code: z.string().trim().min(1),
  propertyId: z.coerce.number().int().positive(),
});

type CreateUnitActionResponse = ApiResponse<null>;

export async function createUnitAction(formData: FormData): Promise<CreateUnitActionResponse> {
  const parsed = createUnitSchema.safeParse({
    code: formData.get("code"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Unit validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { code, propertyId } = parsed.data;

  try {
    await prisma.units.create({
      data: {
        code: code,
        property_id: propertyId,
      },
    });

    return { success: true, message: "Unit created successfully" };
  } catch (error) {
    console.error("Error creating unit:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
