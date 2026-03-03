"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateWhatsappActionResponse = ApiResponse<null>;

export async function createWhatsappAction(formData: FormData): Promise<CreateWhatsappActionResponse> {
  const displayName = formData.get("displayName");
  const wabaId = formData.get("wabaId");
  const phoneId = formData.get("phoneId");
  const phoneNumber = formData.get("phoneNumber");
  const propertyId = formData.get("propertyId");

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
  }

  try {
    await prisma.whatsapp.create({
      data: {
        display_name: displayName as string,
        waba_id: wabaId as string,
        phone_id: phoneId as string,
        phone_number: phoneNumber as string,
        property_id: parsedPropertyId,
      },
    });

    return { success: true, message: "WhatsApp created successfully" };
  } catch (error) {
    console.error("Error creating WhatsApp:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
