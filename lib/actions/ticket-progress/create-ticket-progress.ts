"use server";

import { TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { uploadFileToR2 } from "@/lib/upload";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

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

    if (!user || !hasPermissions(user, "tickets-progress:create")) throw new AuthorizationError();

    const file = formData.get("file") as File | null;

    const parsed = createTicketProgressSchema.parse({
      ticketId: formData.get("ticketId"),
      status: formData.get("status"),
      comment: formData.get("comment"),
    });

    const { ticketId, status, comment } = parsed;

    const ticket = await prisma.tickets.findFirst({
      where: { id: ticketId },
      select: { propertyId: true, status: true },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (!userCanAccessProperty(user, ticket.propertyId)) throw new AuthorizationError();

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        throw new AuthorizationError();
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
        data: { status, updatedBy: user.id },
      });
    });

    return { success: true, message: "Ticket progress created successfully" };
  } catch (error) {
    const response = handleError("createTicketProgressAction", error);
    return { success: false, message: response.message };
  }
}
