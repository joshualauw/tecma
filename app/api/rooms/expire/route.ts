import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextResponse } from "next/server";
import { AuthorizationError, handleError } from "@/lib/error";

export type ExpireRoomApiResponse = ApiResponse<null>;

export async function POST(_request: Request): Promise<NextResponse<ExpireRoomApiResponse>> {
  try {
    const secret = _request.headers.get("x-cron-secret");
    if (!secret || secret !== process.env.CRON_SECRET) {
      throw new AuthorizationError("Invalid secret");
    }

    await prisma.rooms.updateMany({
      where: { status: "active", expiredAt: { lt: new Date() } },
      data: { status: "expired" },
    });

    return NextResponse.json({
      data: null,
      message: "Room expired successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("POST /api/rooms/expire", error);
    return NextResponse.json(
      {
        data: null,
        message: response.message,
        success: false,
      },
      { status: response.code },
    );
  }
}
