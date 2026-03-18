"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const updateWhatsappSchema = z.object({
  id: z.coerce.number().int().positive(),
  displayName: z.string().trim().min(1),
  wabaId: z.string().trim().min(1),
  phoneId: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
});

type UpdateWhatsappActionResponse = ApiResponse<null>;

export async function updateWhatsappAction(formData: FormData): Promise<UpdateWhatsappActionResponse> {
  const session = await auth();
  const user = await getAuthenticatedUser(session?.user?.id);

  if (!user || user.role !== "super-admin") {
    return { success: false, message: "You are not authorized to access this resource" };
  }

  const parsed = updateWhatsappSchema.safeParse({
    id: formData.get("id"),
    displayName: formData.get("displayName"),
    wabaId: formData.get("wabaId"),
    phoneId: formData.get("phoneId"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    console.error("Update WhatsApp validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { id, displayName, wabaId, phoneId, phoneNumber } = parsed.data;

  try {
    await prisma.whatsapp.update({
      where: { id },
      data: { displayName, wabaId, phoneId, phoneNumber },
    });

    return { success: true, message: "WhatsApp updated successfully" };
  } catch (error) {
    console.error("Error updating WhatsApp:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, message: "WhatsApp entry not found" };
      } else if (error.code === "P2002") {
        const match = error.message.match(/fields: \((.*?)\)/);
        const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
        return { success: false, message: `WhatsApp with this ${fieldName} already exists` };
      }
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
