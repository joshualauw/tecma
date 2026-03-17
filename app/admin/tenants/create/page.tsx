import TenantCreateForm from "@/components/admin/tenants/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { hasPermissions } from "@/lib/utils";
import { forbidden, unauthorized } from "next/navigation";

export default async function TenantCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tenants:create")) {
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
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Tenant</h1>
      </div>
      <TenantCreateForm properties={properties} />
    </div>
  );
}
