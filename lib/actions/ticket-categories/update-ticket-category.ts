"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

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

    if (!hasPermissions(user, "tickets-categories:edit")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = updateTicketCategorySchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description"),
    });

    if (!parsed.success) {
      console.error("Update Ticket Category validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id, name, description } = parsed.data;

    await prisma.ticketCategories.update({
      where: { id },
      data: { name, description },
    });

    return { success: true, message: "Ticket category updated successfully" };
  } catch (error) {
    console.error("Error updating ticket category:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket category not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
