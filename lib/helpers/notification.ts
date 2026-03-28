import { AvailablePermission } from "@/lib/constants";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { prisma } from "@/lib/db/prisma";
import { MessageApiItem } from "@/app/api/messages/route";
import { RoomApiItem } from "@/app/api/rooms/route";
import { MessageStatus, RoomStatus } from "@/generated/prisma/enums";
import pusher from "@/lib/integrations/pusher";
import { UsersWhereInput } from "@/generated/prisma/models";

export interface NewMessageStatusNotification {
  messageId: number;
  waId: string;
  messageStatus: MessageStatus;
}

export interface CloseRoomNotification {
  roomId: number;
  status: RoomStatus;
}

export async function getNotifyUsers(permission?: AvailablePermission, propertyId?: number) {
  const conditions: UsersWhereInput[] = [{ role: { name: "super-admin" } }];

  const specificConditions: UsersWhereInput[] = [];

  if (permission) {
    specificConditions.push({
      role: {
        rolePermissions: {
          some: { permission: { name: permission } },
        },
      },
    });
  }

  if (propertyId) {
    specificConditions.push({
      employee: {
        employeePermissions: {
          some: { propertyId },
        },
      },
    });
  }

  if (specificConditions.length > 0) {
    conditions.push({ AND: specificConditions });
  }

  return prisma.users.findMany({
    where: { OR: conditions },
    select: { id: true },
  });
}

export async function notifyNewReceivedMessage(
  propertyId: number,
  isNewRoom: boolean,
  room: RoomApiItem,
  message: MessageApiItem,
) {
  const users = await getNotifyUsers("inbox:view", propertyId);
  for (const user of users) {
    if (isNewRoom) {
      await pusher.trigger(`messages.user-${user.id}`, "new-room", room);
    } else {
      await pusher.trigger(`messages.user-${user.id}`, "update-room", message);
    }
  }
  await pusher.trigger(`messages.room-${room.id}`, "new-message", message);
}

export async function notifyNewSentMessage(propertyId: number, roomId: number, message: MessageApiItem) {
  const users = await getNotifyUsers("inbox:view", propertyId);
  for (const user of users) {
    await pusher.trigger(`messages.user-${user.id}`, "update-room", message);
  }
  await pusher.trigger(`messages.room-${roomId}`, "new-message", message);
}

export async function notifyNewMessageStatus(roomId: number, status: NewMessageStatusNotification) {
  await pusher.trigger(`messages.room-${roomId}`, "new-message-status", status);
}

export async function notifyRoomClosed(propertyId: number, room: CloseRoomNotification) {
  const users = await getNotifyUsers("inbox:view", propertyId);
  for (const user of users) {
    await pusher.trigger(`messages.user-${user.id}`, "close-room", room);
  }
}

export async function notifySystemAction(
  userId: number,
  content: string,
  propertyId?: number,
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

  const [notificationData] = await mapAuditUsers([notification]);

  const users = await getNotifyUsers(permission, propertyId);
  for (const user of users) {
    await pusher.trigger(`notifications.user-${user.id}`, "new-notification", notificationData);
  }
}
