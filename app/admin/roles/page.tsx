import { Plus } from "lucide-react";
import RolesDataTable from "@/components/admin/roles/data-table";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import Link from "next/link";
import { forbidden, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/utils";

export default async function RolesPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles</h1>
        </div>
        <Link href="/admin/roles/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Create Role
          </Button>
        </Link>
      </div>

      <RolesDataTable />
    </div>
  );
}
