"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createPropertySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).nullable(),
});

type CreatePropertyActionResponse = ApiResponse<null>;

export async function createPropertyAction(formData: FormData): Promise<CreatePropertyActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || user.role !== "super-admin") {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = createPropertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    console.error("Create Property validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { name, address } = parsed.data;

  try {
    await prisma.properties.create({
      data: { name, address },
    });

    return { success: true, message: "Property created successfully" };
  } catch (error) {
    console.error("Error creating property:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
