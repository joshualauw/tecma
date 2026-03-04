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
      property_id: true,
      tenant_id: true,
      unit_id: true,
      category_id: true,
      employee_id: true,
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
        created_at: "asc",
      },
    }),
    prisma.ticketCategories.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        created_at: "asc",
      },
    }),
  ]);

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Ticket</h1>
      </div>
      <TicketUpdateForm
        data={{
          id: ticket.id,
          propertyId: ticket.property_id,
          tenantId: ticket.tenant_id,
          unitId: ticket.unit_id,
          categoryId: ticket.category_id,
          employeeId: ticket.employee_id,
          status: ticket.status,
          priority: ticket.priority,
          title: ticket.title,
          description: ticket.description,
        }}
        properties={properties}
        categories={categories}
      />
    </div>
  );
}
