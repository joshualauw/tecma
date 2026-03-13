import TicketUpdateForm from "@/components/admin/tickets/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface TicketUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketUpdatePage({ params }: TicketUpdatePageProps) {
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
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  const [properties, categories] = await Promise.all([
    prisma.properties.findMany({
      select: {
        id: true,
        name: true,
      },
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
        createdAt: "asc",
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
