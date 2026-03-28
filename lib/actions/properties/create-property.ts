"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const createPropertySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).nullable(),
});

type CreatePropertyActionResponse = ApiResponse<null>;

export async function createPropertyAction(formData: FormData): Promise<CreatePropertyActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = createPropertySchema.parse({
      name: formData.get("name"),
      address: formData.get("address"),
    });

    const { name, address } = parsed;

    await prisma.properties.create({
      data: { name, address, createdBy: user.id },
    });

    await createAndSendNotification(user.id, `Property ${name} created`, null);

    return { success: true, message: "Property created successfully" };
  } catch (error) {
    const response = handleError("createPropertyAction", error);
    return { success: false, message: response.message };
  }
}
