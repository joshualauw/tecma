import TicketProgressCreateForm from "@/components/admin/tickets/progress/create-form";
import TicketProgressDataList from "@/components/admin/tickets/progress/data-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface TicketsProgressPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketsProgressPage({ params }: TicketsProgressPageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets-progress:view")) {
    forbidden();
  }

  const canCreateProgress = hasPermissions(user, "tickets-progress:create");
  const canEditProgress = hasPermissions(user, "tickets-progress:edit");

  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    notFound();
  }

  const ticket = await prisma.tickets.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true, propertyId: true },
  });

  if (!ticket) {
    notFound();
  }

  if (!userCanAccessProperty(user, ticket.propertyId)) {
    forbidden();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tickets Progress</h1>
        </div>
        {canCreateProgress && <TicketProgressCreateForm ticketId={ticketId} status={ticket.status} />}
      </div>
      <TicketProgressDataList ticketId={ticketId} canEditProgress={canEditProgress} />
    </div>
  );
}
