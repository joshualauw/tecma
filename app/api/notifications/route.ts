import { auth } from "@/lib/auth";
import { AuthorizationError, handleError } from "@/lib/errors";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { prisma } from "@/lib/db/prisma";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { NotificationsWhereInput } from "@/generated/prisma/models";

export type NotificationApiItem = BaseApiData & {
  propertyId: number | null;
  content: string;
  type: string;
};

export type NotificationsApiData = {
  notifications: NotificationApiItem[];
  count: number;
};

const notificationsQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
});

export type NotificationsApiResponse = ApiResponse<NotificationsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<NotificationsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);
    const parsed = notificationsQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
    });

    const { page, size } = parsed;

    const where: NotificationsWhereInput = {};
    if (!isSuperAdmin(user)) {
      where.propertyId = { in: user.allowedProperties };
      where.type = { in: user.permissions.map((permission) => permission.split(":")[0]) };
    }

    const rows = await prisma.notifications.findMany({
      select: {
        id: true,
        propertyId: true,
        type: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
      where,
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    });

    const count = await prisma.notifications.count({ where });

    const notifications: NotificationApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: { notifications, count },
      message: "Notifications fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/notifications", error);
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
