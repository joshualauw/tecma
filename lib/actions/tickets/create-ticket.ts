"use server";

import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

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

    if (!user || !hasPermissions(user, "tickets:create")) throw new AuthorizationError();

    const parsed = createTicketSchema.parse({
      propertyId: formData.get("propertyId"),
      leaseId: formData.get("leaseId"),
      categoryId: formData.get("categoryId"),
      employeeIds: formData.getAll("employeeIds"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });

    const { propertyId, leaseId, categoryId, employeeIds, title, description, priority } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    const lease = await prisma.leases.findFirst({
      where: { id: leaseId, propertyId },
      select: { id: true },
    });
    if (!lease) {
      throw new Error("Lease not found for this property");
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
        createdBy: user.id,
      },
    });

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    const response = handleError("createTicketAction", error);
    return { success: false, message: response.message };
  }
}
