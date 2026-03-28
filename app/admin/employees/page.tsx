import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EmployeesDataTable from "@/components/admin/employees/data-table";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { forbidden, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/helpers/permission";

export default async function EmployeesPage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

  const roles = await prisma.role.findMany({
    where: {
      name: {
        not: "super-admin",
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employees</h1>
        </div>
        <Link href="/admin/employees/create">
          <Button className="w-full md:w-auto shadow-sm">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </Link>
      </div>

      <EmployeesDataTable roles={roles} />
    </div>
  );
}
