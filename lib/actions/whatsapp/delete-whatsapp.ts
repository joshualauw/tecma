"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const deleteWhatsappSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteWhatsappActionResponse = ApiResponse<null>;

export async function deleteWhatsappAction(whatsappId: number): Promise<DeleteWhatsappActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) throw new AuthorizationError();

    const parsed = deleteWhatsappSchema.parse({
      id: whatsappId,
    });

    const { id } = parsed;

    const whatsapp = await prisma.whatsapp.findUnique({
      where: { id },
      select: { displayName: true },
    });
    if (!whatsapp) {
      throw new Error("WhatsApp not found");
    }

    await prisma.whatsapp.delete({
      where: { id },
    });

    await createAndSendNotification(user.id, `WhatsApp ${whatsapp.displayName} deleted`);

    return { success: true, message: "WhatsApp deleted successfully" };
  } catch (error) {
    const response = handleError("deleteWhatsappAction", error);
    return { success: false, message: response.message };
  }
}
