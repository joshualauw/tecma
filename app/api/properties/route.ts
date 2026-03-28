import { PropertiesWhereInput } from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse, BaseApiData } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { isSuperAdmin } from "@/lib/helpers/permission";
import { mapAuditUsers } from "@/lib/mappers/audit";
import { AuthorizationError, handleError } from "@/lib/errors";

export type PropertyApiItem = BaseApiData & {
  name: string;
  address: string | null;
};

export type PropertiesApiData = {
  properties: PropertyApiItem[];
  count: number;
};

const propertyQuery = z.object({
  page: z.coerce.number().int().default(0),
  size: z.coerce.number().int().positive().default(10),
  search: z.string().trim().nullable(),
});

export type PropertiesApiResponse = ApiResponse<PropertiesApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<PropertiesApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const { searchParams } = new URL(request.url);

    const parsed = propertyQuery.parse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    const { page, size, search } = parsed;

    const where: PropertiesWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.properties.findMany({
      select: {
        id: true,
        name: true,
        address: true,
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

    const propertiesCount = await prisma.properties.count({ where });
    const properties: PropertyApiItem[] = await mapAuditUsers(rows);

    return NextResponse.json({
      data: {
        properties,
        count: propertiesCount,
      },
      message: "Properties fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/properties", error);
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
