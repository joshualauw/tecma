import TicketCategoryUpdateForm from "@/components/admin/tickets/categories/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import { hasPermissions } from "@/lib/helpers/permission";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface TicketCategoryUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketCategoryUpdatePage({ params }: TicketCategoryUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets-categories:edit")) {
    forbidden();
  }

  const { id } = await params;
  const ticketCategoryId = Number(id);

  if (!Number.isInteger(ticketCategoryId) || ticketCategoryId <= 0) {
    notFound();
  }

  const ticketCategory = await prisma.ticketCategories.findUnique({
    where: {
      id: ticketCategoryId,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!ticketCategory) {
    notFound();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Ticket Category</h1>
      </div>
      <TicketCategoryUpdateForm data={ticketCategory} />
    </div>
  );
}
