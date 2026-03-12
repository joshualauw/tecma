"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TicketPriority, TicketStatus, UserRole } from "@/generated/prisma/enums";
import { createTicketAction } from "@/lib/actions/tickets/create-ticket";
import { useLeanEmployees } from "@/lib/fetching/employees/use-lean-employees";
import { useLeanTenants } from "@/lib/fetching/tenants/use-lean-tenants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  propertyId: z.string().trim().min(1, "Property is required"),
  tenantId: z.string().trim().min(1, "Tenant is required"),
  categoryId: z.string().trim().min(1, "Category is required"),
  employeeId: z.string().trim().min(1, "Employee is required"),
  status: z.enum([TicketStatus.open, TicketStatus.in_progress, TicketStatus.closed]),
  priority: z.enum([TicketPriority.low, TicketPriority.medium, TicketPriority.high]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
});

interface TicketCreateFormProps {
  properties: {
    id: number;
    name: string;
  }[];
  categories: {
    id: number;
    name: string;
  }[];
}

const statusOptions = [
  { value: TicketStatus.open, label: "Open" },
  { value: TicketStatus.in_progress, label: "In Progress" },
  { value: TicketStatus.closed, label: "Closed" },
];

const priorityOptions = [
  { value: TicketPriority.low, label: "Low" },
  { value: TicketPriority.medium, label: "Medium" },
  { value: TicketPriority.high, label: "High" },
];

export default function TicketCreateForm({ properties, categories }: TicketCreateFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      tenantId: "",
      categoryId: "",
      employeeId: "",
      status: TicketStatus.open,
      priority: TicketPriority.low,
      title: "",
      description: "",
    },
  });

  const selectedPropertyId = form.watch("propertyId");
  const selectedTenantId = form.watch("tenantId");

  const {
    tenants,
    isLoading: isLoadingTenants,
    error: tenantsError,
  } = useLeanTenants({
    propertyId: selectedPropertyId,
  });
  const {
    employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useLeanEmployees({
    propertyId: selectedPropertyId,
    role: UserRole.worker,
  });

  const isLoadingOptions = isLoadingTenants || isLoadingEmployees;

  useEffect(() => {
    form.setValue("tenantId", "");
    form.setValue("employeeId", "");
  }, [form, selectedPropertyId]);

  useEffect(() => {
    if (tenantsError || employeesError) {
      toast.error("Failed to load tenants and employees");
    }
  }, [tenantsError, employeesError]);

  const selectedTenant = tenants.find((tenant) => tenant.id === Number(selectedTenantId));
  const unitCode = selectedTenant ? selectedTenant.unit.code : "";

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("propertyId", data.propertyId);
    formData.append("tenantId", data.tenantId);
    formData.append("categoryId", data.categoryId);
    formData.append("employeeId", data.employeeId);
    formData.append("status", data.status);
    formData.append("priority", data.priority);
    formData.append("title", data.title);
    if (data.description) {
      formData.append("description", data.description);
    }

    const result = await createTicketAction(formData);
    if (result.success) {
      router.push("/admin/tickets");
      toast.success("Ticket created successfully");
    } else {
      toast.error(result.message || "Failed to create ticket");
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="propertyId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Property</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="tenantId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tenant</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedPropertyId || isLoadingOptions || tenants.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !selectedPropertyId
                              ? "Select a property first"
                              : isLoadingOptions
                                ? "Loading tenants..."
                                : tenants.length === 0
                                  ? "No tenants found"
                                  : "Select a tenant"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={String(tenant.id)}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel>Unit</FieldLabel>
                <Input value={unitCode} placeholder="From tenant" readOnly />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Category</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="employeeId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Employee</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedPropertyId || isLoadingOptions || employees.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !selectedPropertyId
                              ? "Select a property first"
                              : isLoadingOptions
                                ? "Loading employees..."
                                : employees.length === 0
                                  ? "No employees found"
                                  : "Select an employee"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="priority"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Priority</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Title</FieldLabel>
                  <Input {...field} placeholder="Leaking faucet in bathroom" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea {...field} className="h-36" placeholder="Provide more details" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Save"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
