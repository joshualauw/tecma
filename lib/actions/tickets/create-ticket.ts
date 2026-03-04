"use server";

import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/ApiResponse";

type CreateTicketActionResponse = ApiResponse<null>;

export async function createTicketAction(formData: FormData): Promise<CreateTicketActionResponse> {
  const propertyId = formData.get("propertyId");
  const tenantId = formData.get("tenantId");
  const categoryId = formData.get("categoryId");
  const employeeId = formData.get("employeeId");
  const title = formData.get("title");
  const description = formData.get("description");
  const status = formData.get("status");
  const priority = formData.get("priority");
  const unitId = formData.get("unitId");

  const parsedPropertyId = Number(propertyId);
  if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
    return { success: false, message: "Invalid property id" };
  }

  const parsedTenantId = Number(tenantId);
  if (!Number.isInteger(parsedTenantId) || parsedTenantId <= 0) {
    return { success: false, message: "Invalid tenant id" };
  }

  const parsedCategoryId = Number(categoryId);
  if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
    return { success: false, message: "Invalid category id" };
  }

  const parsedEmployeeId = Number(employeeId);
  if (!Number.isInteger(parsedEmployeeId) || parsedEmployeeId <= 0) {
    return { success: false, message: "Invalid employee id" };
  }

  const parsedUnitId = Number(unitId);
  if (!Number.isInteger(parsedUnitId) || parsedUnitId <= 0) {
    return { success: false, message: "Invalid unit id" };
  }

  const normalizedTitle = String(title ?? "").trim();
  if (!normalizedTitle) {
    return { success: false, message: "Title is required" };
  }

  const normalizedStatus = String(status ?? "");
  const normalizedPriority = String(priority ?? "");

  if (!(normalizedStatus in TicketStatus)) {
    return { success: false, message: "Invalid ticket status" };
  }

  if (!(normalizedPriority in TicketPriority)) {
    return { success: false, message: "Invalid ticket priority" };
  }

  try {
    await prisma.tickets.create({
      data: {
        property_id: parsedPropertyId,
        tenant_id: parsedTenantId,
        unit_id: parsedUnitId,
        category_id: parsedCategoryId,
        employee_id: parsedEmployeeId,
        title: normalizedTitle,
        description: String(description ?? "").trim() || null,
        status: normalizedStatus as (typeof TicketStatus)[keyof typeof TicketStatus],
        priority: normalizedPriority as (typeof TicketPriority)[keyof typeof TicketPriority],
      },
    });

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
