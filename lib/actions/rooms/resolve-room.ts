"use server";

import { RoomStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const resolveRoomSchema = z.object({
  roomId: z.coerce.number().int().positive(),
});

type ResolveRoomActionResponse = ApiResponse<null>;

export async function resolveRoomAction(roomId: number): Promise<ResolveRoomActionResponse> {
  const parsed = resolveRoomSchema.safeParse({ roomId });

  if (!parsed.success) {
    console.error("Resolve Room validation failed:", parsed.error);
    return { success: false, message: "Invalid room ID" };
  }

  const { roomId: id } = parsed.data;

  const existingRoom = await prisma.rooms.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingRoom) {
    return { success: false, message: "Room not found" };
  }

  try {
    await prisma.rooms.update({
      where: { id },
      data: {
        status: RoomStatus.closed,
        closed_at: new Date(),
      },
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
