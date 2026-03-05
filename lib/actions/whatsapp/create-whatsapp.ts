"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateWhatsappActionResponse = ApiResponse<null>;

export async function createWhatsappAction(formData: FormData): Promise<CreateWhatsappActionResponse> {
  const displayName = formData.get("displayName");
  const wabaId = formData.get("wabaId");
  const phoneId = formData.get("phoneId");
  const phoneNumber = formData.get("phoneNumber");

  try {
    await prisma.whatsapp.create({
      data: {
        display_name: displayName as string,
        waba_id: wabaId as string,
        phone_id: phoneId as string,
        phone_number: phoneNumber as string,
      },
    });

    return { success: true, message: "WhatsApp created successfully" };
  } catch (error) {
    console.error("Error creating WhatsApp:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
