"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type DeleteWhatsappActionResponse = ApiResponse<null>;

export async function deleteWhatsappAction(whatsappId: number): Promise<DeleteWhatsappActionResponse> {
  if (!Number.isInteger(whatsappId) || whatsappId <= 0) {
    return { success: false, message: "Invalid whatsapp id" };
  }

  try {
    const existingWhatsapp = await prisma.whatsapp.findUnique({
      where: {
        id: whatsappId,
      },
      select: {
        id: true,
      },
    });

    if (!existingWhatsapp) {
      return { success: false, message: "WhatsApp not found" };
    }

    await prisma.whatsapp.delete({
      where: {
        id: whatsappId,
      },
    });

    return { success: true, message: "WhatsApp deleted successfully" };
  } catch (error) {
    console.error("Error deleting WhatsApp:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
