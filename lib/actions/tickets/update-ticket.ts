"use server";

import { Prisma } from "@/generated/prisma/client";
import { TicketPriority } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

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
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "tickets:edit")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = updateTicketSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    employeeIds: formData.getAll("employeeIds"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    console.error("Update Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, categoryId, employeeIds, title, description, priority } = parsed.data;

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
      },
    });

    return { success: true, message: "Ticket updated successfully" };
  } catch (error) {
    console.error("Error updating ticket:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
