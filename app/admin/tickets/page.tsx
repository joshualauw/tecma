import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicketsDataTable from "@/components/admin/tickets/data-table";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, propertiesWhereForUser } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";

export default async function TicketsPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets:view")) {
    forbidden();
  }

  const canCreate = hasPermissions(user, "tickets:create");
  const canEdit = hasPermissions(user, "tickets:edit");
  const canDelete = hasPermissions(user, "tickets:delete");

  const [properties, categories] = await Promise.all([
    prisma.properties.findMany({
      select: { id: true, name: true },
      where: propertiesWhereForUser(user),
      orderBy: { createdAt: "asc" },
    }),
    prisma.ticketCategories.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tickets</h1>
        </div>
        {canCreate && (
          <Link href="/admin/tickets/create">
            <Button className="w-full md:w-auto shadow-sm">
              <Plus className="h-4 w-4" /> Add Ticket
            </Button>
          </Link>
        )}
      </div>

      <TicketsDataTable properties={properties} categories={categories} permissions={{ canEdit, canDelete }} />
    </div>
  );
}
