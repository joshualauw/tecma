import TenantUpdateForm from "@/components/admin/tenants/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface TenantUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantUpdatePage({ params }: TenantUpdatePageProps) {
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
      phone_number: true,
      address: true,
      property_id: true,
      unit_id: true,
    },
  });

  if (!tenant) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Tenant</h1>
      </div>
      <TenantUpdateForm
        data={{
          id: tenant.id,
          name: tenant.name,
          phoneNumber: tenant.phone_number,
          address: tenant.address,
          propertyId: tenant.property_id,
          unitId: tenant.unit_id,
        }}
        properties={properties}
      />
    </div>
  );
}
