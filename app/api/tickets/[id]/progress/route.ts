import { TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextResponse } from "next/server";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";

export type TicketProgressApiItem = BaseApiData & {
  ticketId: number;
  beforeStatus: TicketStatus;
  afterStatus: TicketStatus;
  comment: string | null;
  imageUrl: string | null;
};

export type TicketProgressApiData = {
  progress: TicketProgressApiItem[];
};

const ticketProgressParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TicketProgressApiResponse = ApiResponse<TicketProgressApiData>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<TicketProgressApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-progress:view")) throw new AuthorizationError();

    const contextParams = await context.params;
    const parsed = ticketProgressParams.parse({ id: contextParams.id });
    const { id } = parsed;

    const ticket = await prisma.tickets.findFirstOrThrow({
      where: { id },
      select: { id: true, propertyId: true },
    });

    if (!userCanAccessProperty(user, ticket.propertyId)) throw new AuthorizationError();

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId: id, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        throw new AuthorizationError();
      }
    }

    const rows = await prisma.ticketProgress.findMany({
      where: { ticketId: id },
      select: {
        id: true,
        ticketId: true,
        beforeStatus: true,
        afterStatus: true,
        comment: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const progress: TicketProgressApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: { progress },
      message: "Ticket progress fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/tickets/[id]/progress", error);
    return NextResponse.json(
      {
        data: null,
        message: response.message,
        success: false,
      },
      { status: response.code },
    );
  }
}
