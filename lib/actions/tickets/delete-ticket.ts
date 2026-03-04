"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteTicketActionResponse = ApiResponse<null>;

export async function deleteTicketAction(ticketId: number): Promise<DeleteTicketActionResponse> {
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return { success: false, message: "Invalid ticket id" };
  }

  try {
    const existingTicket = await prisma.tickets.findUnique({
      where: {
        id: ticketId,
      },
      select: {
        id: true,
      },
    });

    if (!existingTicket) {
      return { success: false, message: "Ticket not found" };
    }

    await prisma.tickets.delete({
      where: {
        id: ticketId,
      },
    });

    return { success: true, message: "Ticket deleted successfully" };
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
