import { WhatsappWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import { NextRequest, NextResponse } from "next/server";

export type WhatsappApiItem = {
  id: number;
  display_name: string;
  waba_id: string;
  phone_id: string;
  phone_number: string;
  created_at: Date | null;
};

export type WhatsappApiData = {
  whatsapps: WhatsappApiItem[];
  count: number;
};

export type WhatsappApiResponse = ApiResponse<WhatsappApiData>;

export async function GET(request: NextRequest): Promise<NextResponse<WhatsappApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get("page") ?? 0);
    const sizeParam = Number(searchParams.get("size") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();

    const page = Number.isFinite(pageParam) && pageParam >= 0 ? Math.floor(pageParam) : 0;
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.floor(sizeParam) : 10;

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
