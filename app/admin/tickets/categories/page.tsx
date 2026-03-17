import TicketCategoriesDataTable from "@/components/admin/tickets/categories/data-table";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { hasPermissions } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { forbidden, unauthorized } from "next/navigation";

export default async function TicketsCategoriesPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tickets:categories:view")) {
    forbidden();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ticket Categories</h1>
        </div>
        <Link href="/admin/tickets/categories/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </Link>
      </div>

      <TicketCategoriesDataTable />
    </div>
  );
}
