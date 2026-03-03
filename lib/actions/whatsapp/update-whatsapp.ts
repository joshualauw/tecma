"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type UpdateWhatsappActionResponse = ApiResponse<null>;

export async function updateWhatsappAction(formData: FormData): Promise<UpdateWhatsappActionResponse> {
  const id = formData.get("id");
  const displayName = formData.get("displayName");
  const wabaId = formData.get("wabaId");
  const phoneId = formData.get("phoneId");
  const phoneNumber = formData.get("phoneNumber");
  const propertyId = formData.get("propertyId");

  const whatsappId = Number(id);
  if (!Number.isInteger(whatsappId) || whatsappId <= 0) {
    return { success: false, message: "Invalid whatsapp id" };
  }

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
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

    await prisma.whatsapp.update({
      where: {
        id: whatsappId,
      },
      data: {
        display_name: displayName as string,
        waba_id: wabaId as string,
        phone_id: phoneId as string,
        phone_number: phoneNumber as string,
        property_id: parsedPropertyId,
      },
    });

    return { success: true, message: "WhatsApp updated successfully" };
  } catch (error) {
    console.error("Error updating WhatsApp:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
