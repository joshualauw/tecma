"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deletePropertySchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeletePropertyActionResponse = ApiResponse<null>;

export async function deletePropertyAction(propertyId: number): Promise<DeletePropertyActionResponse> {
  const parsed = deletePropertySchema.safeParse({ id: propertyId });

  if (!parsed.success) {
    console.error("Delete Property validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id } = parsed.data;

  try {
    await prisma.properties.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Property deleted successfully" };
  } catch (error) {
    console.error("Error deleting property:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Property not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
