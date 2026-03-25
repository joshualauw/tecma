"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { replaceFileFromR2 } from "@/lib/upload";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateTicketProgressSchema = z.object({
  id: z.coerce.number().int().positive(),
  comment: z.string().trim(),
});

type UpdateTicketProgressActionResponse = ApiResponse<null>;

export async function updateTicketProgressAction(formData: FormData): Promise<UpdateTicketProgressActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || !hasPermissions(user, "tickets-progress:edit")) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const file = formData.get("file") as File | null;

  const parsed = updateTicketProgressSchema.safeParse({
    id: formData.get("id"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    console.error("Update ticket progress validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, comment } = parsed.data;

  const ticketProgress = await prisma.ticketProgress.findUnique({
    where: { id },
    select: {
      id: true,
      ticketId: true,
      imageUrl: true,
      createdBy: true,
      ticket: {
        select: { propertyId: true },
      },
    },
  });

  if (!ticketProgress) {
    return { success: false, message: "Ticket progress not found" };
  }

  if (!userCanAccessProperty(user, ticketProgress.ticket.propertyId)) {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  if (user.role !== "super-admin") {
    const ticketAssignment = await prisma.ticketAssignments.findFirst({
      where: { ticketId: ticketProgress.ticketId, employee: { userId: user.id } },
    });
    if (!ticketAssignment) {
      return { success: false, message: "You are not authorized to access this resource" };
    }
  }

  try {
    let imageUrl = ticketProgress.imageUrl;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await replaceFileFromR2(
        ticketProgress.imageUrl,
        buffer,
        file.type || "application/octet-stream",
        "ticket-progress",
      );
    }

    await prisma.ticketProgress.update({
      where: { id },
      data: { comment, imageUrl },
    });

    return { success: true, message: "Ticket progress updated successfully" };
  } catch (error) {
    console.error("Error updating ticket progress:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket progress not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
