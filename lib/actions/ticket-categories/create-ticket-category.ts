"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateTicketCategoryActionResponse = ApiResponse<null>;

export async function createTicketCategoryAction(formData: FormData): Promise<CreateTicketCategoryActionResponse> {
  const name = formData.get("name");
  const description = formData.get("description");

  try {
    await prisma.ticketCategories.create({
      data: {
        name: name as string,
        description: (description as string) || null,
      },
    });

    return { success: true, message: "Ticket category created successfully" };
  } catch (error) {
    console.error("Error creating ticket category:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
