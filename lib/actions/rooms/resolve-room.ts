"use server";

import { RoomStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const resolveRoomSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type ResolveRoomActionResponse = ApiResponse<null>;

export async function resolveRoomAction(roomId: number): Promise<ResolveRoomActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "inbox:send")) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = resolveRoomSchema.safeParse({ id: roomId });

    if (!parsed.success) {
      console.error("Resolve Room validation failed:", parsed.error);
      return { success: false, message: "Invalid room ID" };
    }

    const { id } = parsed.data;

    const room = await prisma.rooms.findFirstOrThrow({
      where: { id },
      select: { status: true },
    });

    if (room.status != RoomStatus.active) {
      return { success: false, message: "Room already closed" };
    }

    await prisma.rooms.update({
      where: { id },
      data: { status: RoomStatus.closed, closedAt: new Date(), updatedBy: user.id },
    });

    return { success: true, message: "Room resolved successfully" };
  } catch (error) {
    console.error("Error resolving room:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "Room not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
