"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updatePropertySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).nullable(),
});

type UpdatePropertyActionResponse = ApiResponse<null>;

export async function updatePropertyAction(formData: FormData): Promise<UpdatePropertyActionResponse> {
  const parsed = updatePropertySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    console.error("Update Property validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, name, address } = parsed.data;

  try {
    await prisma.properties.update({
      where: {
        id,
      },
      data: {
        name: name,
        address: address,
      },
    });

    return { success: true, message: "Property updated successfully" };
  } catch (error) {
    console.error("Error updating property:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Property not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
