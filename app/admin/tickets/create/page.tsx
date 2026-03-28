import TicketCreateForm from "@/components/admin/tickets/create-form";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, propertiesWhereForUser } from "@/lib/helpers/permission";
import { forbidden, unauthorized } from "next/navigation";

export default async function TicketCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets:create")) {
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Ticket</h1>
      </div>
      <TicketCreateForm properties={properties} categories={categories} />
    </div>
  );
}
