import { WhatsappWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

export type WhatsappApiItem = BaseApiData & {
  displayName: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
};

export type WhatsappApiData = {
  whatsapps: WhatsappApiItem[];
  count: number;
};

const whatsappQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
});

export type WhatsappApiResponse = ApiResponse<WhatsappApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<WhatsappApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = whatsappQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    const { page, size, search } = parsed;

    const where: WhatsappWhereInput = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.whatsapp.findMany({
      select: {
        id: true,
        displayName: true,
        wabaId: true,
        phoneId: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        createdAt: "desc",
      },
    });

    const whatsappCount = await prisma.whatsapp.count({ where });
    const whatsapps: WhatsappApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        whatsapps,
        count: whatsappCount,
      },
      message: "WhatsApp fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/whatsapp", error);
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
