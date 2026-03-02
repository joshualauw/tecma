import PropertyUpdateForm from "@/components/admin/properties/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PropertyUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyUpdatePage({ params }: PropertyUpdatePageProps) {
  const { id } = await params;
  const propertyId = Number(id);

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    notFound();
  }

  const property = await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Property</h1>
      </div>
      <PropertyUpdateForm data={{ id: property.id, name: property.name, address: property.address }} />
    </div>
  );
}
