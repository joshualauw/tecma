import TenantLeasesDataTable from "@/components/admin/tenants/lease/data-table";
import CreateLeaseForm from "@/components/admin/tenants/lease/create-form";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/utils";

interface TenantLeasePageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantLeasePage({ params }: TenantLeasePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "tenants:leases:view")) {
    forbidden();
  }

  const canCreateLease = hasPermissions(user, "tenants:leases:create");
  const canEditLease = hasPermissions(user, "tenants:leases:edit");

  const { id } = await params;
  const tenantId = Number(id);

  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: { propertyId: true },
  });

  if (!tenant) {
    notFound();
  }

  if (!userCanAccessProperty(user, tenant.propertyId)) {
    forbidden();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenant Leases</h1>
        </div>
        {canCreateLease && <CreateLeaseForm tenantId={tenantId} propertyId={tenant.propertyId} />}
      </div>
      <TenantLeasesDataTable tenantId={tenantId} permissions={{ canEditLease }} />
    </div>
  );
}
