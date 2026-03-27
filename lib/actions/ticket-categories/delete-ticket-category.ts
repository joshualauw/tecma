"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

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

    await prisma.ticketCategories.delete({
      where: { id },
    });

    return { success: true, message: "Ticket category deleted successfully" };
  } catch (error) {
    const response = handleError("deleteTicketCategoryAction", error);
    return { success: false, message: response.message };
  }
}
