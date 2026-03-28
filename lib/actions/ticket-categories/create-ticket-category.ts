"use server";

import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/user";
import { hasPermissions } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";
import z from "zod";
import { AuthorizationError, handleError } from "@/lib/error";
import { createAndSendNotification } from "@/lib/notification";

const createTicketCategorySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable(),
});

type CreateTicketCategoryActionResponse = ApiResponse<null>;

export async function createTicketCategoryAction(formData: FormData): Promise<CreateTicketCategoryActionResponse> {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session?.user?.id);

    if (!user || !hasPermissions(user, "tickets-categories:create")) throw new AuthorizationError();

    const parsed = createTicketCategorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const { name, description } = parsed;

    await prisma.ticketCategories.create({
      data: { name, description, createdBy: user.id },
    });

    await createAndSendNotification(user.id, `Ticket category ${name} created`, null, "tickets-categories:view");

    return { success: true, message: "Ticket category created successfully" };
  } catch (error) {
    const response = handleError("createTicketCategoryAction", error);
    return { success: false, message: response.message };
  }
}
