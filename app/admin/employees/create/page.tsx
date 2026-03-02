import EmployeeCreateForm from "@/components/admin/employees/create-form";
import { prisma } from "@/lib/prisma";

export default async function EmployeeCreatePage() {
  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Employee</h1>
      </div>
      <EmployeeCreateForm properties={properties} />
    </div>
  );
}
