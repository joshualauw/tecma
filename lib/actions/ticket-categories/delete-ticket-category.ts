"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteTicketCategorySchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTicketCategoryActionResponse = ApiResponse<null>;

export async function deleteTicketCategoryAction(
  ticketCategoryId: number,
): Promise<DeleteTicketCategoryActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!hasPermissions(user, "tickets-categories:delete")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = deleteTicketCategorySchema.safeParse({ id: ticketCategoryId });

  if (!parsed.success) {
    console.error("Delete Ticket Category validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id } = parsed.data;

  try {
    await prisma.ticketCategories.delete({
      where: { id },
    });

    return { success: true, message: "Ticket category deleted successfully" };
  } catch (error) {
    console.error("Error deleting ticket category:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket category not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
