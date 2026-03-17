import EmployeeUpdateForm from "@/components/admin/employees/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface EmployeeUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeUpdatePage({ params }: EmployeeUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "employees:edit")) {
    forbidden();
  }

  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  const employee = await prisma.employees.findUnique({
    where: {
      id: employeeId,
    },
    select: {
      id: true,
      phoneNumber: true,
      address: true,
      user: {
        select: {
          name: true,
          email: true,
          roleId: true,
        },
      },
    },
  });

  if (!employee) {
    notFound();
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

  const formData = {
    id: employee.id,
    name: employee.user.name,
    email: employee.user.email,
    roleId: employee.user.roleId,
    phoneNumber: employee.phoneNumber,
    address: employee.address,
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Employee</h1>
      </div>
      <EmployeeUpdateForm data={formData} roles={roles} />
    </div>
  );
}
