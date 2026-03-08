"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTicketActionResponse = ApiResponse<null>;

export async function deleteTicketAction(ticketId: number): Promise<DeleteTicketActionResponse> {
  const parsed = deleteTicketSchema.safeParse({ id: ticketId });

  if (!parsed.success) {
    console.error("Delete Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid ticket ID" };
  }

  const { id } = parsed.data;

  try {
    await prisma.tickets.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Ticket deleted successfully" };
  } catch (error) {
    console.error("Error deleting ticket:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
