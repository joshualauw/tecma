"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const deleteTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTicketActionResponse = ApiResponse<null>;

export async function deleteTicketAction(ticketId: number): Promise<DeleteTicketActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "tickets:delete")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = deleteTicketSchema.safeParse({ id: ticketId });

  if (!parsed.success) {
    console.error("Delete Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id } = parsed.data;

  const ticket = await prisma.tickets.findFirst({
    where: { id },
    select: { propertyId: true },
  });

  if (!ticket) {
    return { success: false, message: "Ticket not found" };
  }

  if (!userCanAccessProperty(user, ticket.propertyId)) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  if (user.role !== "super-admin") {
    const ticketAssignment = await prisma.ticketAssignments.findFirst({
      where: { ticketId: id, employee: { userId: user.id } },
    });
    if (!ticketAssignment) {
      return { success: false, message: "You are not authorized to access this resource" };
    }
  }

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
