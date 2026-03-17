import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/permission";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { forbidden } from "next/navigation";

export async function getProperties() {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user) {
    return forbidden();
  }

  if (!hasPermissions(user, "properties:view")) {
    return forbidden();
  }

  return prisma.properties.findMany({
    where:
      user.role === "super-admin"
        ? undefined
        : {
            employeePermissions: {
              some: {
                employee: {
                  userId: user.id,
                },
              },
            },
          },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
