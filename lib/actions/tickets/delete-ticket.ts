"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

const deleteTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteTicketActionResponse = ApiResponse<null>;

export async function deleteTicketAction(ticketId: number): Promise<DeleteTicketActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets:delete")) throw new AuthorizationError();

    const parsed = deleteTicketSchema.parse({ id: ticketId });

    const { id } = parsed;

    const ticket = await prisma.tickets.findFirst({
      where: { id },
      select: { propertyId: true },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (!userCanAccessProperty(user, ticket.propertyId)) throw new AuthorizationError();

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId: id, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        throw new AuthorizationError();
      }
    }

    await prisma.tickets.delete({
      where: {
        id,
      },
    });

    return { success: true, message: "Ticket deleted successfully" };
  } catch (error) {
    const response = handleError("deleteTicketAction", error);
    return { success: false, message: response.message };
  }
}
