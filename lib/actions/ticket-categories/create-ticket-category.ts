"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTicketCategorySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable(),
});

type CreateTicketCategoryActionResponse = ApiResponse<null>;

export async function createTicketCategoryAction(formData: FormData): Promise<CreateTicketCategoryActionResponse> {
  const parsed = createTicketCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    console.error("Create Ticket Category validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { name, description } = parsed.data;

  try {
    await prisma.ticketCategories.create({
      data: {
        name: name,
        description: description,
      },
    });

    return { success: true, message: "Ticket category created successfully" };
  } catch (error) {
    console.error("Error creating ticket category:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
