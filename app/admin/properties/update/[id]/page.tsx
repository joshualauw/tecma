import PropertyUpdateForm from "@/components/admin/properties/update-form";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/utils";

interface PropertyUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyUpdatePage({ params }: PropertyUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

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
      <PropertyUpdateForm data={property} />
    </div>
  );
}
