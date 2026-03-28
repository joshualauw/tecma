"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const deletePropertySchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeletePropertyActionResponse = ApiResponse<null>;

export async function deletePropertyAction(propertyId: number): Promise<DeletePropertyActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = deletePropertySchema.parse({ id: propertyId });

    const { id } = parsed;

    const property = await prisma.properties.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!property) {
      throw new Error("Property not found");
    }

    await prisma.properties.delete({
      where: { id },
    });

    await notifySystemAction(user.id, `Property ${property.name} deleted`, null);

    return { success: true, message: "Property deleted successfully" };
  } catch (error) {
    const response = handleError("deletePropertyAction", error);
    return { success: false, message: response.message };
  }
}
