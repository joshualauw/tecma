import UnitCreateForm from "@/components/admin/units/create-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { forbidden, unauthorized } from "next/navigation";
import { hasPermissions, propertiesWhereForUser } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function UnitCreatePage() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!hasPermissions(user, "units:create")) {
    forbidden();
  }

  const properties = await prisma.properties.findMany({
    select: {
      id: true,
      name: true,
    },
    where: propertiesWhereForUser(user),
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Unit</h1>
      </div>
      <UnitCreateForm properties={properties} />
    </div>
  );
}
