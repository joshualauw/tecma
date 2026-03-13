import TenantLeasesDataTable from "@/components/admin/tenants/lease/data-table";
import CreateLeaseForm from "@/components/admin/tenants/lease/create-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface TenantLeasePageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantLeasePage({ params }: TenantLeasePageProps) {
  const { id } = await params;
  const tenantId = Number(id);

  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    select: { propertyId: true },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenant Leases</h1>
        </div>
        <CreateLeaseForm tenantId={tenantId} propertyId={tenant.propertyId} />
      </div>
      <TenantLeasesDataTable tenantId={tenantId} />
    </div>
  );
}
