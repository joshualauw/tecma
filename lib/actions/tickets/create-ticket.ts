"use server";

import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTicketSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  tenantId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  status: z.enum(TicketStatus),
  priority: z.enum(TicketPriority),
  unitId: z.coerce.number().int().positive(),
});

type CreateTicketActionResponse = ApiResponse<null>;

export async function createTicketAction(formData: FormData): Promise<CreateTicketActionResponse> {
  const parsed = createTicketSchema.safeParse({
    propertyId: formData.get("propertyId"),
    tenantId: formData.get("tenantId"),
    categoryId: formData.get("categoryId"),
    employeeId: formData.get("employeeId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    unitId: formData.get("unitId"),
  });

  if (!parsed.success) {
    console.error("Create Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { propertyId, tenantId, categoryId, employeeId, title, description, status, priority, unitId } = parsed.data;

  try {
    await prisma.tickets.create({
      data: {
        propertyId,
        tenantId,
        unitId,
        categoryId,
        employeeId,
        title: title,
        description: description,
        status: status,
        priority: priority,
      },
    });

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
