"use server";

import { Prisma } from "@/generated/prisma/client";
import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  status: z.enum(TicketStatus),
  priority: z.enum(TicketPriority),
});

type UpdateTicketActionResponse = ApiResponse<null>;

export async function updateTicketAction(formData: FormData): Promise<UpdateTicketActionResponse> {
  const parsed = updateTicketSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    employeeId: formData.get("employeeId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    console.error("Update Ticket validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, categoryId, employeeId, title, description, status, priority } = parsed.data;

  try {
    await prisma.tickets.update({
      where: {
        id: id,
      },
      data: {
        categoryId,
        employeeId,
        title: title,
        description: description,
        status: status,
        priority: priority,
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
