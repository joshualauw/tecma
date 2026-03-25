"use server";

import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTicketSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  leaseId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().nullable(),
  employeeIds: z.array(z.coerce.number().int().positive()).default([]),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  priority: z.enum(TicketPriority),
});

type CreateTicketActionResponse = ApiResponse<null>;

export async function createTicketAction(formData: FormData): Promise<CreateTicketActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets:create")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = createTicketSchema.safeParse({
      propertyId: formData.get("propertyId"),
      leaseId: formData.get("leaseId"),
      categoryId: formData.get("categoryId"),
      employeeIds: formData.getAll("employeeIds"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });

    if (!parsed.success) {
      console.error("Create Ticket validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { propertyId, leaseId, categoryId, employeeIds, title, description, priority } = parsed.data;

    if (!userCanAccessProperty(user, propertyId)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const lease = await prisma.leases.findFirst({
      where: { id: leaseId, propertyId },
      select: { id: true },
    });
    if (!lease) {
      return { success: false, message: "Lease not found for this property" };
    }

    await prisma.tickets.create({
      data: {
        propertyId,
        leaseId,
        categoryId,
        title,
        description,
        status: TicketStatus.open,
        priority,
        ticketAssignments: {
          createMany: {
            data: employeeIds.map((employeeId) => ({ employeeId })),
          },
        },
      },
    });

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
