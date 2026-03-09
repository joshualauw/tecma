import UnitUpdateForm from "@/components/admin/units/update-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface UnitUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitUpdatePage({ params }: UnitUpdatePageProps) {
  const { id } = await params;
  const unitId = Number(id);

  if (!Number.isInteger(unitId) || unitId <= 0) {
    notFound();
  }

  const unit = await prisma.units.findUnique({
    where: {
      id: unitId,
    },
    select: {
      id: true,
      code: true,
      propertyId: true,
    },
  });

  if (!unit) {
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Unit</h1>
      </div>
      <UnitUpdateForm data={unit} properties={properties} />
    </div>
  );
}
