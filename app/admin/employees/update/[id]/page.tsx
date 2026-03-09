import EmployeeUpdateForm from "@/components/admin/employees/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface EmployeeUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeUpdatePage({ params }: EmployeeUpdatePageProps) {
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
      name: true,
      phoneNumber: true,
      address: true,
      propertyId: true,
    },
  });

  if (!employee) {
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
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Employee</h1>
      </div>
      <EmployeeUpdateForm data={employee} properties={properties} />
    </div>
  );
}
