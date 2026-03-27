"use server";

import { TicketPriority } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

const updateTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().nullable(),
  employeeIds: z.array(z.coerce.number().int().positive()).default([]),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  priority: z.enum(TicketPriority),
});

type UpdateTicketActionResponse = ApiResponse<null>;

export async function updateTicketAction(formData: FormData): Promise<UpdateTicketActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets:edit")) throw new AuthorizationError();

    const parsed = updateTicketSchema.parse({
      id: formData.get("id"),
      categoryId: formData.get("categoryId"),
      employeeIds: formData.getAll("employeeIds"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });

    const { id, categoryId, employeeIds, title, description, priority } = parsed;

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

    await prisma.tickets.update({
      where: {
        id: id,
      },
      data: {
        categoryId,
        title,
        description,
        priority,
        ticketAssignments: {
          deleteMany: {},
          createMany: {
            data: employeeIds.map((employeeId) => ({ employeeId })),
          },
        },
        updatedBy: user.id,
      },
    });

    return { success: true, message: "Ticket updated successfully" };
  } catch (error) {
    const response = handleError("updateTicketAction", error);
    return { success: false, message: response.message };
  }
}
