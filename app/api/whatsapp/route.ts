import { WhatsappWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export type WhatsappApiItem = {
  id: number;
  display_name: string;
  waba_id: string;
  phone_id: string;
  phone_number: string;
  created_at: Date;
  updated_at: Date;
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
    const { searchParams } = new URL(request.url);

    const parsed = whatsappQuery.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      search: searchParams.get("search"),
    });

    if (!parsed.success) {
      console.error("WhatsApp query validation failed:", parsed.error);
      return NextResponse.json(
        {
          data: null,
          message: "Invalid query parameters",
          success: false,
        },
        { status: 400 },
      );
    }

    const { page, size, search } = parsed.data;

    const where: WhatsappWhereInput = {};

    if (search) {
      where.OR = [
        { display_name: { contains: search, mode: "insensitive" } },
        { phone_number: { contains: search, mode: "insensitive" } },
      ];
    }

    const whatsapps = await prisma.whatsapp.findMany({
      select: {
        id: true,
        display_name: true,
        waba_id: true,
        phone_id: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
      where,
      skip: page * size,
      take: size,
      orderBy: {
        created_at: "asc",
      },
    });

    const whatsappCount = await prisma.whatsapp.count({ where });

    return NextResponse.json({
      data: {
        whatsapps,
        count: whatsappCount,
      },
      message: "WhatsApp fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp:", error);
    return NextResponse.json(
      {
        data: null,
        message: "An error occurred while fetching WhatsApp",
        success: false,
      },
      { status: 500 },
    );
  }
}
