"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

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

    await prisma.properties.delete({
      where: { id },
    });

    return { success: true, message: "Property deleted successfully" };
  } catch (error) {
    const response = handleError("deletePropertyAction", error);
    return { success: false, message: response.message };
  }
}
