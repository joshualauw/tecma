"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createWhatsappSchema = z.object({
  displayName: z.string().trim().min(1),
  wabaId: z.string().trim().min(1),
  phoneId: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .trim()
    .min(1),
});

type CreateWhatsappActionResponse = ApiResponse<null>;

export async function createWhatsappAction(formData: FormData): Promise<CreateWhatsappActionResponse> {
  const parsed = createWhatsappSchema.safeParse({
    displayName: formData.get("displayName"),
    wabaId: formData.get("wabaId"),
    phoneId: formData.get("phoneId"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    console.error("Create WhatsApp validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { displayName, wabaId, phoneId, phoneNumber } = parsed.data;

  try {
    await prisma.whatsapp.create({
      data: {
        display_name: displayName,
        waba_id: wabaId,
        phone_id: phoneId,
        phone_number: phoneNumber,
      },
    });

    return { success: true, message: "WhatsApp created successfully" };
  } catch (error) {
    console.error("Error creating WhatsApp:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, message: "A WhatsApp with this phone number already exists" };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
