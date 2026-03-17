import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TenantsDataTable from "@/components/admin/tenants/data-table";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";

export default async function TenantsPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tenants:view")) {
    forbidden();
  }

  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    where: user.role === "super-admin" ? undefined : { id: { in: user.allowedProperties } },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenants</h1>
        </div>
        <Link href="/admin/tenants/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Tenant
          </Button>
        </Link>
      </div>

      <TenantsDataTable properties={properties} />
    </div>
  );
}
