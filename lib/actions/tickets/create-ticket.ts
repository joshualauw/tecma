"use server";

import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTicketSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  leaseId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().nullable(),
  employeeId: z.coerce.number().int().positive().nullable(),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  status: z.enum(TicketStatus),
  priority: z.enum(TicketPriority),
});

type CreateTicketActionResponse = ApiResponse<null>;

export async function createTicketAction(formData: FormData): Promise<CreateTicketActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!hasPermissions(user, "tickets:create")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = createTicketSchema.safeParse({
    propertyId: formData.get("propertyId"),
    leaseId: formData.get("leaseId"),
    categoryId: formData.get("categoryId"),
    employeeId: formData.get("employeeId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    console.error("Create Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { propertyId, leaseId, categoryId, employeeId, title, description, status, priority } = parsed.data;

  try {
    await prisma.tickets.create({
      data: {
        propertyId,
        leaseId,
        categoryId,
        employeeId,
        title,
        description,
        status,
        priority,
      },
    });

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
