"use server";

import { auth } from "@/lib/auth";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";

const updateWhatsappSchema = z.object({
  id: z.coerce.number().int().positive(),
  displayName: z.string().trim().min(1),
  wabaId: z.string().trim().min(1),
  phoneId: z.string().trim().min(1),
  phoneNumber: z.string().regex(PHONE_NUMBER_REGEX).trim().min(1),
});

type UpdateWhatsappActionResponse = ApiResponse<null>;

export async function updateWhatsappAction(formData: FormData): Promise<UpdateWhatsappActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = updateWhatsappSchema.parse({
      id: formData.get("id"),
      displayName: formData.get("displayName"),
      wabaId: formData.get("wabaId"),
      phoneId: formData.get("phoneId"),
      phoneNumber: formData.get("phoneNumber"),
    });

    const { id, displayName, wabaId, phoneId, phoneNumber } = parsed;

    await prisma.whatsapp.update({
      where: { id },
      data: { displayName, wabaId, phoneId, phoneNumber, updatedBy: user.id },
    });

    return { success: true, message: "WhatsApp updated successfully" };
  } catch (error) {
    const response = handleError("updateWhatsappAction", error);
    return { success: false, message: response.message };
  }
}
