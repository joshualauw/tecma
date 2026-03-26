import { Prisma } from "@/generated/prisma/client";
import { TicketStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { mapAuditUsers } from "@/lib/mappers/audit-mapper";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextResponse } from "next/server";
import z from "zod";

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

    if (!user || !hasPermissions(user, "tickets-progress:view")) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    const contextParams = await context.params;
    const parsed = ticketProgressParams.safeParse({ id: contextParams.id });

    if (!parsed.success) {
      console.error("Ticket progress query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    const ticket = await prisma.tickets.findFirstOrThrow({
      where: { id },
      select: { id: true, propertyId: true },
    });

    if (!userCanAccessProperty(user, ticket.propertyId)) {
      return NextResponse.json(
        {
          data: null,
          message: "You are not authorized to access this resource",
          success: false,
        },
        { status: 403 },
      );
    }

    if (user.role !== "super-admin") {
      const ticketAssignment = await prisma.ticketAssignments.findFirst({
        where: { ticketId: id, employee: { userId: user.id } },
      });
      if (!ticketAssignment) {
        return NextResponse.json(
          {
            data: null,
            message: "You are not authorized to access this resource",
            success: false,
          },
          { status: 403 },
        );
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
    console.error("Error fetching ticket progress:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        {
          data: null,
          message: "Ticket progress not found",
          success: false,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching ticket progress",
        success: false,
      },
      { status: 500 },
    );
  }
}
