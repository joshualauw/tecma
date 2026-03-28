"use server";

import { RoomStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";
import { notifySystemAction, notifyRoomClosed } from "@/lib/helpers/notification";

const resolveRoomSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type ResolveRoomActionResponse = ApiResponse<null>;

export async function resolveRoomAction(roomId: number): Promise<ResolveRoomActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "inbox:send")) throw new AuthorizationError();

    const parsed = resolveRoomSchema.parse({ id: roomId });

    const { id } = parsed;

    const room = await prisma.rooms.findFirstOrThrow({
      where: { id },
      select: { status: true, propertyId: true, tenant: { select: { name: true } } },
    });

    if (room.status != RoomStatus.active) {
      throw new Error("Room already closed");
    }

    await prisma.rooms.update({
      where: { id },
      data: { status: RoomStatus.closed, closedAt: new Date(), updatedBy: user.id },
    });

    await notifySystemAction(user.id, `Room for ${room.tenant.name} resolved`, room.propertyId, "inbox:view");
    await notifyRoomClosed(room.propertyId, { roomId, status: RoomStatus.closed });

    return { success: true, message: "Room resolved successfully" };
  } catch (error) {
    const response = handleError("resolveRoomAction", error);
    return { success: false, message: response.message };
  }
}
