"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreatePropertyActionResponse = ApiResponse<null>;

export async function createPropertyAction(formData: FormData): Promise<CreatePropertyActionResponse> {
  const name = formData.get("name");
  const address = formData.get("address");

  try {
    await prisma.properties.create({
      data: {
        name: name as string,
        address: address as string,
      },
    });

    return { success: true, message: "Property created successfully" };
  } catch (error) {
    console.error("Error creating property:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
