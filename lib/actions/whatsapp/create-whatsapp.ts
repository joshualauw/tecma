"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";

const createWhatsappSchema = z.object({
  displayName: z.string().trim().min(1),
  wabaId: z.string().trim().min(1),
  phoneId: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
});

type CreateWhatsappActionResponse = ApiResponse<null>;

export async function createWhatsappAction(formData: FormData): Promise<CreateWhatsappActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || user.role !== "super-admin") {
      return { success: false, message: "You are not authorized to access this resource" };
    }

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

    await prisma.whatsapp.create({
      data: {
        displayName,
        wabaId,
        phoneId,
        phoneNumber,
      },
    });

    return { success: true, message: "WhatsApp created successfully" };
  } catch (error) {
    console.error("Error creating WhatsApp:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const match = error.message.match(/fields: \((.*?)\)/);
      const fieldName = match ? match[1].replace(/[`"]/g, "").replace("_", " ") : "field";
      return { success: false, message: `WhatsApp with this ${fieldName} already exists` };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
