"use server";

import { auth } from "@/lib/auth";
import { replaceFileFromR2 } from "@/lib/upload";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const updateTicketProgressSchema = z.object({
  id: z.coerce.number().int().positive(),
  comment: z.string().trim(),
});

type UpdateTicketProgressActionResponse = ApiResponse<null>;

export async function updateTicketProgressAction(formData: FormData): Promise<UpdateTicketProgressActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-progress:edit")) throw new AuthorizationError();

    const file = formData.get("file") as File | null;

    const parsed = updateTicketProgressSchema.parse({
      id: formData.get("id"),
      comment: formData.get("comment"),
    });

    const { id, comment } = parsed;

    const ticketProgress = await prisma.ticketProgress.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        createdBy: true,
        ticket: {
          select: { propertyId: true, title: true, id: true },
        },
      },
    });

    if (!ticketProgress) {
      throw new Error("Ticket progress not found");
    }

    if (!userCanAccessProperty(user, ticketProgress.ticket.propertyId)) throw new AuthorizationError();

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId: ticketProgress.ticket.id, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        throw new AuthorizationError();
      }
    }

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
      data: { comment, imageUrl, updatedBy: user.id },
    });

    await createAndSendNotification(
      user.id,
      `Ticket progress ${ticketProgress.ticket.title} updated`,
      ticketProgress.ticket.propertyId,
      "tickets-progress:view",
    );

    return { success: true, message: "Ticket progress updated successfully" };
  } catch (error) {
    const response = handleError("updateTicketProgressAction", error);
    return { success: false, message: response.message };
  }
}
