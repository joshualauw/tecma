import EmployeeCreateForm from "@/components/admin/employees/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized } from "next/navigation";

export default async function EmployeeCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (user.role !== "super-admin") {
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
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Employee</h1>
      </div>
      <EmployeeCreateForm roles={roles} />
    </div>
  );
}
