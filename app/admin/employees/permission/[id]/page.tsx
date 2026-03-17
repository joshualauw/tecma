import CreatePermissionForm from "@/components/admin/employees/permission/create-form";
import EmployeePermissionsDataTable from "@/components/admin/employees/permission/data-table";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface EmployeePermissionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeePermissionPage({ params }: EmployeePermissionPageProps) {
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
