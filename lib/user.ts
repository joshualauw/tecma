import { AvailablePermission } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AuthenticatedUser } from "@/types/AuthenticatedUser";

export async function getAuthenticatedUser(userId?: number): Promise<AuthenticatedUser | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: {
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
      },
      employee: {
        select: {
          employeePermissions: {
            select: {
              propertyId: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.rolePermissions.map((p) => p.permission.name as AvailablePermission),
    allowedProperties: user.employee?.employeePermissions.map((p) => p.propertyId) ?? [],
  };
}
