"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateUnitActionResponse = ApiResponse<null>;

export async function createUnitAction(formData: FormData): Promise<CreateUnitActionResponse> {
  const code = formData.get("code");
  const propertyId = formData.get("propertyId");

  try {
    await prisma.units.create({
      data: {
        code: code as string,
        property_id: Number(propertyId),
      },
    });

    return { success: true, message: "Unit created successfully" };
  } catch (error) {
    console.error("Error creating unit:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
