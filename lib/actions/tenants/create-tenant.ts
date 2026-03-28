"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const createTenantSchema = z.object({
  name: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
  address: z.string().trim().min(1).nullable(),
  propertyId: z.coerce.number().int().positive(),
});

type CreateTenantActionResponse = ApiResponse<null>;

export async function createTenantAction(formData: FormData): Promise<CreateTenantActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tenants:create")) throw new AuthorizationError();

    const parsed = createTenantSchema.parse({
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      address: formData.get("address"),
      propertyId: formData.get("propertyId"),
    });

    const { name, phoneNumber, address, propertyId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    await prisma.tenants.create({
      data: {
        name: name,
        phoneNumber,
        address: address,
        propertyId,
        createdBy: user.id,
      },
    });

    await createAndSendNotification(user.id, `Tenant ${name} created`, propertyId, "tenants:view");

    return { success: true, message: "Tenant created successfully" };
  } catch (error) {
    const response = handleError("createTenantAction", error);
    return { success: false, message: response.message };
  }
}
