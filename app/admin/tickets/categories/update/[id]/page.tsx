import TicketCategoryUpdateForm from "@/components/admin/tickets/categories/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface TicketCategoryUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketCategoryUpdatePage({ params }: TicketCategoryUpdatePageProps) {
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
