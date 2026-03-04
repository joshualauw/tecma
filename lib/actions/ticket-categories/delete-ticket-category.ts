"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteTicketCategoryActionResponse = ApiResponse<null>;

export async function deleteTicketCategoryAction(
  ticketCategoryId: number,
): Promise<DeleteTicketCategoryActionResponse> {
  if (!Number.isInteger(ticketCategoryId) || ticketCategoryId <= 0) {
    return { success: false, message: "Invalid ticket category id" };
  }

  try {
    const existingCategory = await prisma.ticketCategories.findUnique({
      where: {
        id: ticketCategoryId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCategory) {
      return { success: false, message: "Ticket category not found" };
    }

    await prisma.ticketCategories.delete({
      where: {
        id: ticketCategoryId,
      },
    });

    return { success: true, message: "Ticket category deleted successfully" };
  } catch (error) {
    console.error("Error deleting ticket category:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
