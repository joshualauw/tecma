import { AvailablePermission } from "@/lib/constants";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { prisma } from "@/lib/prisma";
import pusher from "@/lib/pusher";

export async function createAndSendNotification(
  userId: number,
  content: string,
  propertyId?: number | null,
  permission?: AvailablePermission,
) {
  const type = permission ? permission.split(":")[0] : "system";

  const notification = await prisma.notifications.create({
    data: {
      content,
      type,
      propertyId,
      createdBy: userId,
    },
    select: {
      id: true,
      content: true,
      propertyId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      updatedBy: true,
    },
  });

  const receiverUserIds = new Set<number>();
  const user = await prisma.users.findFirstOrThrow({
    where: {
      role: {
        name: "super-admin",
      },
    },
  });
  receiverUserIds.add(user.id);

  if (propertyId && permission) {
    const userPermissions = await prisma.users.findMany({
      where: {
        AND: [
          {
            role: {
              rolePermissions: {
                some: { permission: { name: permission } },
              },
            },
          },
          {
            employee: {
              employeePermissions: {
                some: { propertyId },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    for (const p of userPermissions) {
      receiverUserIds.add(p.id);
    }
  }

  const [notificationData] = await mapAuditUsers([notification]);

  for (const userId of receiverUserIds) {
    await pusher.trigger(`notifications.user-${userId}`, "new-notification", notificationData);
  }
}
