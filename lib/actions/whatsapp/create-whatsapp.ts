"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

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

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = createWhatsappSchema.parse({
      displayName: formData.get("displayName"),
      wabaId: formData.get("wabaId"),
      phoneId: formData.get("phoneId"),
      phoneNumber: formData.get("phoneNumber"),
    });

    const { displayName, wabaId, phoneId, phoneNumber } = parsed;

    await prisma.whatsapp.create({
      data: {
        displayName,
        wabaId,
        phoneId,
        phoneNumber,
        createdBy: user.id,
      },
    });

    await createAndSendNotification(user.id, `WhatsApp ${displayName} created`);

    return { success: true, message: "WhatsApp created successfully" };
  } catch (error) {
    const response = handleError("createWhatsappAction", error);
    return { success: false, message: response.message };
  }
}
