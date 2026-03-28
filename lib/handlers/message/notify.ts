import { MessageApiItem } from "@/app/api/messages/route";
import { prisma } from "@/lib/prisma";
import pusher from "@/lib/pusher";
import { RoomApiItem } from "@/app/api/rooms/route";
import { MessageStatus, RoomStatus } from "@/generated/prisma/enums";

export interface NewMessageStatusNotification {
  messageId: number;
  waId: string;
  messageStatus: MessageStatus;
}

export interface CloseRoomNotification {
  roomId: number;
  status: RoomStatus;
}

export async function getNotifyUsers(propertyId: number) {
  return await prisma.users.findMany({
    where: {
      OR: [
        { role: { name: "super-admin" } },
        {
          AND: [
            {
              role: {
                rolePermissions: {
                  some: { permission: { name: "inbox:view" } },
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
      ],
    },
    select: { id: true },
  });
}

export async function notifyNewReceivedMessage(
  propertyId: number,
  isNewRoom: boolean,
  room: RoomApiItem,
  message: MessageApiItem,
) {
  const users = await getNotifyUsers(propertyId);
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
  const users = await getNotifyUsers(propertyId);
  for (const user of users) {
    await pusher.trigger(`messages.user-${user.id}`, "update-room", message);
  }
  await pusher.trigger(`messages.room-${roomId}`, "new-message", message);
}

export async function notifyNewMessageStatus(roomId: number, status: NewMessageStatusNotification) {
  await pusher.trigger(`messages.room-${roomId}`, "new-message-status", status);
}

export async function notifyRoomClosed(propertyId: number, room: CloseRoomNotification) {
  const users = await getNotifyUsers(propertyId);
  for (const user of users) {
    await pusher.trigger(`messages.user-${user.id}`, "close-room", room);
  }
}
