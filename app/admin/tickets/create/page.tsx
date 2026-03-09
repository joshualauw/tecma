import TicketCreateForm from "@/components/admin/tickets/create-form";
import { prisma } from "@/lib/prisma";

export default async function TicketCreatePage() {
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Ticket</h1>
      </div>
      <TicketCreateForm properties={properties} categories={categories} />
    </div>
  );
}
