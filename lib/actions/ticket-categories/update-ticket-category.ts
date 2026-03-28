"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const updateTicketCategorySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable(),
});

type UpdateTicketCategoryActionResponse = ApiResponse<null>;

export async function updateTicketCategoryAction(formData: FormData): Promise<UpdateTicketCategoryActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-categories:edit")) throw new AuthorizationError();

    const parsed = updateTicketCategorySchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const { id, name, description } = parsed;

    await prisma.ticketCategories.update({
      where: { id },
      data: { name, description, updatedBy: user.id },
    });

    await notifySystemAction(user.id, `Ticket category ${name} updated`, null, "tickets-categories:view");

    return { success: true, message: "Ticket category updated successfully" };
  } catch (error) {
    const response = handleError("updateTicketCategoryAction", error);
    return { success: false, message: response.message };
  }
}
