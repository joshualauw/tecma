import RoleUpdateForm from "@/components/admin/roles/update-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { forbidden, notFound, unauthorized } from "next/navigation";
import { isSuperAdmin } from "@/lib/helpers/permission";

interface RoleUpdatePageProps {
  params: Promise<{ id: string }>;
}

export default async function RoleUpdatePage({ params }: RoleUpdatePageProps) {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    unauthorized();
  }

  if (!isSuperAdmin(user)) {
    forbidden();
  }

  const { id } = await params;
  const roleId = Number(id);

  if (!Number.isInteger(roleId) || roleId <= 0) {
    notFound();
  }

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
    select: {
      id: true,
      name: true,
      rolePermissions: {
        select: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!role || role.name === "super-admin") {
    notFound();
  }

  const formData = {
    id: role.id,
    name: role.name,
    permissions: role.rolePermissions.map((rp) => rp.permission.name),
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Update Role</h1>
      </div>
      <RoleUpdateForm data={formData} />
    </div>
  );
}
