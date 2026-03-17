import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UnitsDataTable from "@/components/admin/units/data-table";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { forbidden, unauthorized } from "next/navigation";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function UnitsPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "units:view")) {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Units</h1>
        </div>
        <Link href="/admin/units/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Units
          </Button>
        </Link>
      </div>

      <UnitsDataTable properties={properties} />
    </div>
  );
}
