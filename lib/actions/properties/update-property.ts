"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const updatePropertySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).nullable(),
});

type UpdatePropertyActionResponse = ApiResponse<null>;

export async function updatePropertyAction(formData: FormData): Promise<UpdatePropertyActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = updatePropertySchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      address: formData.get("address"),
    });

    const { id, name, address } = parsed;

    await prisma.properties.update({
      where: { id },
      data: { name, address, updatedBy: user.id },
    });

    await createAndSendNotification(user.id, `Property ${name} updated`, null);

    return { success: true, message: "Property updated successfully" };
  } catch (error) {
    const response = handleError("updatePropertyAction", error);
    return { success: false, message: response.message };
  }
}
