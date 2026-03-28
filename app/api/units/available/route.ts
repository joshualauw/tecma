import { LeaseStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/helpers/user";
import { hasPermissions, userCanAccessProperty } from "@/lib/helpers/permission";
import { prisma } from "@/lib/db/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/errors";

export type AvailableUnitsApiItem = {
  id: number;
  code: string;
};

export type AvailableUnitsApiData = {
  units: AvailableUnitsApiItem[];
};

const availableUnitsQuery = z.object({
  propertyId: z.coerce.number().int().positive(),
});

export type AvailableUnitsApiResponse = ApiResponse<AvailableUnitsApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<AvailableUnitsApiResponse>> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (
      !user ||
      !hasPermissions(user, "tenants:view", "tenants-leases:view", "tenants-leases:create", "tenants-leases:edit")
    ) {
      throw new AuthorizationError();
    }

    const { searchParams } = new URL(request.url);

    const parsed = availableUnitsQuery.parse({
      propertyId: searchParams.get("propertyId"),
    });

    const { propertyId } = parsed;

    if (!userCanAccessProperty(user, propertyId)) throw new AuthorizationError();

    const units = await prisma.units.findMany({
      select: {
        id: true,
        code: true,
      },
      where: {
        propertyId,
        leases: { none: { status: LeaseStatus.active } },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      data: {
        units,
      },
      message: "Available units fetched successfully",
      success: true,
    });
  } catch (error) {
    const response = handleError("GET /api/units/available", error);
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
