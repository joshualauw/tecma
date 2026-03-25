import TicketUpdateForm from "@/components/admin/tickets/update-form";
import { prisma } from "@/lib/prisma";
import { notFound, forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, propertiesWhereForUser, userCanAccessProperty } from "@/lib/utils";

interface TicketUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketUpdatePage({ params }: TicketUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets:edit")) {
    forbidden();
  }

  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    notFound();
  }

  const ticket = await prisma.tickets.findUnique({
    where: {
      id: ticketId,
    },
    select: {
      id: true,
      propertyId: true,
      lease: {
        select: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      categoryId: true,
      ticketAssignments: {
        select: {
          employeeId: true,
        },
      },
      title: true,
      description: true,
      priority: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  if (!userCanAccessProperty(user, ticket.propertyId)) {
    forbidden();
  }

  const [properties, categories] = await Promise.all([
    prisma.properties.findMany({
      select: {
        id: true,
        name: true,
      },
      where: propertiesWhereForUser(user),
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.ticketCategories.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Ticket</h1>
      </div>
      <TicketUpdateForm data={ticket} properties={properties} categories={categories} />
    </div>
  );
}
