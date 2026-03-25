"use server";

import { Prisma } from "@/generated/prisma/client";
import { TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { uploadFileToR2 } from "@/lib/upload";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createTicketProgressSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  status: z.enum(TicketStatus),
  comment: z.string().trim().optional(),
});

type CreateTicketProgressActionResponse = ApiResponse<null>;

export async function createTicketProgressAction(formData: FormData): Promise<CreateTicketProgressActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-progress:create")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const file = formData.get("file") as File | null;

    const parsed = createTicketProgressSchema.safeParse({
      ticketId: formData.get("ticketId"),
      status: formData.get("status"),
      comment: formData.get("comment"),
    });

    if (!parsed.success) {
      console.error("Create ticket progress validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { ticketId, status, comment } = parsed.data;

    const ticket = await prisma.tickets.findFirst({
      where: { id: ticketId },
      select: { propertyId: true, status: true },
    });

    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    if (!userCanAccessProperty(user, ticket.propertyId)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        return { success: false, message: "You are not authorized to access this resource" };
      }
    }

    let imageUrl: string | null = null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadFileToR2(buffer, file.type, "ticket-progress");
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticketProgress.create({
        data: {
          ticketId,
          beforeStatus: ticket.status,
          afterStatus: status,
          comment,
          imageUrl,
          createdBy: user.id,
        },
      });

      await tx.tickets.update({
        where: { id: ticketId },
        data: { status },
      });
    });

    return { success: true, message: "Ticket progress created successfully" };
  } catch (error) {
    console.error("Error creating ticket progress:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Ticket not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
