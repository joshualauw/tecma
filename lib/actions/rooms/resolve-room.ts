"use server";

import { RoomStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";

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
      select: { status: true },
    });

    if (room.status != RoomStatus.active) {
      throw new Error("Room already closed");
    }

    await prisma.rooms.update({
      where: { id },
      data: { status: RoomStatus.closed, closedAt: new Date(), updatedBy: user.id },
    });

    return { success: true, message: "Room resolved successfully" };
  } catch (error) {
    const response = handleError("resolveRoomAction", error);
    return { success: false, message: response.message };
  }
}
