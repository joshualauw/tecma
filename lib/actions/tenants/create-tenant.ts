"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/permission";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTenantSchema = z.object({
  name: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().trim().min(1).nullable(),
  propertyId: z.coerce.number().int().positive(),
});

type CreateTenantActionResponse = ApiResponse<null>;

export async function createTenantAction(formData: FormData): Promise<CreateTenantActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!hasPermissions(user, "tenants:create")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    address: formData.get("address"),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    console.error("Create Tenant validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { name, phoneNumber, address, propertyId } = parsed.data;

  try {
    await prisma.tenants.create({
      data: {
        name: name,
        phoneNumber,
        address: address,
        propertyId,
      },
    });

    return { success: true, message: "Tenant created successfully" };
  } catch (error) {
    console.error("Error creating tenant:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const match = error.message.match(/fields: \((.*?)\)/);
      const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
      return { success: false, message: `Tenant with this ${fieldName} already exists` };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
