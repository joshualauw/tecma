"use server";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { isSuperAdmin } from "@/lib/utils";

const deleteWhatsappSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type DeleteWhatsappActionResponse = ApiResponse<null>;

export async function deleteWhatsappAction(whatsappId: number): Promise<DeleteWhatsappActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !isSuperAdmin(user)) {
      return { success: false, message: "You are not authorized to access this resource" };
    }

    const parsed = deleteWhatsappSchema.safeParse({
      id: whatsappId,
    });

    if (!parsed.success) {
      console.error("Delete WhatsApp validation failed:", parsed.error);
      return { success: false, message: "Invalid input" };
    }

    const { id } = parsed.data;

    await prisma.whatsapp.delete({
      where: { id },
    });

    return { success: true, message: "WhatsApp deleted successfully" };
  } catch (error) {
    console.error("Error deleting WhatsApp:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "WhatsApp not found" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
