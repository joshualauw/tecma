"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdateTicketCategoryActionResponse = ApiResponse<null>;

export async function updateTicketCategoryAction(formData: FormData): Promise<UpdateTicketCategoryActionResponse> {
  const id = formData.get("id");
  const name = formData.get("name");
  const description = formData.get("description");

  const ticketCategoryId = Number(id);
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

    await prisma.ticketCategories.update({
      where: {
        id: ticketCategoryId,
      },
      data: {
        name: name as string,
        description: (description as string) || null,
      },
    });

    return { success: true, message: "Ticket category updated successfully" };
  } catch (error) {
    console.error("Error updating ticket category:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
