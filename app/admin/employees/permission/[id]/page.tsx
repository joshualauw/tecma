import CreatePermissionForm from "@/components/admin/employees/permission/create-form";
import EmployeePermissionsDataTable from "@/components/admin/employees/permission/data-table";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface EmployeePermissionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeePermissionPage({ params }: EmployeePermissionPageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "employees:permissions:view")) {
    forbidden();
  }

  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Permissions</h1>
        </div>
        <CreatePermissionForm employeeId={employeeId} properties={properties} />
      </div>
      <EmployeePermissionsDataTable employeeId={employeeId} />
    </div>
  );
}
