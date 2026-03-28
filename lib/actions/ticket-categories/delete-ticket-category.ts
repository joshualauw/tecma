"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction } from "@/lib/helpers/notification";

const deleteTicketCategorySchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTicketCategoryActionResponse = ApiResponse<null>;

export async function deleteTicketCategoryAction(
  ticketCategoryId: number,
): Promise<DeleteTicketCategoryActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-categories:delete")) throw new AuthorizationError();

    const parsed = deleteTicketCategorySchema.parse({ id: ticketCategoryId });

    const { id } = parsed;

    const category = await prisma.ticketCategories.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!category) {
      throw new Error("Ticket category not found");
    }

    await prisma.ticketCategories.delete({
      where: { id },
    });

    await notifySystemAction(user.id, `Ticket category ${category.name} deleted`, null, "tickets-categories:view");

    return { success: true, message: "Ticket category deleted successfully" };
  } catch (error) {
    const response = handleError("deleteTicketCategoryAction", error);
    return { success: false, message: response.message };
  }
}
