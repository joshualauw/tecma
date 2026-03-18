import TenantUpdateForm from "@/components/admin/tenants/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface TenantUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantUpdatePage({ params }: TenantUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tenants:edit")) {
    forbidden();
  }

  const { id } = await params;
  const tenantId = Number(id);

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    notFound();
  }

  const tenant = await prisma.tenants.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  if (!userCanAccessProperty(user, tenant.property.id)) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Tenant</h1>
      </div>
      <TenantUpdateForm data={tenant} />
    </div>
  );
}
