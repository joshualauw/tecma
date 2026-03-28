import UnitUpdateForm from "@/components/admin/units/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { forbidden, notFound, unauthorized } from "next/navigation";

interface UnitUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitUpdatePage({ params }: UnitUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "units:edit")) {
    forbidden();
  }

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
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!unit) {
    notFound();
  }

  if (!userCanAccessProperty(user, unit.property.id)) {
    forbidden();
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Unit</h1>
      </div>
      <UnitUpdateForm data={unit} />
    </div>
  );
}
