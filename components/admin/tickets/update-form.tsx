"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TicketPriority, TicketStatus, UserRole } from "@/generated/prisma/enums";
import { updateTicketAction } from "@/lib/actions/tickets/update-ticket";
import { useLeanEmployees } from "@/lib/fetching/employees/use-lean-employees";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  categoryId: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
  status: z.enum([TicketStatus.open, TicketStatus.in_progress, TicketStatus.closed]),
  priority: z.enum([TicketPriority.low, TicketPriority.medium, TicketPriority.high]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
});

interface TicketUpdateFormProps {
  data: {
    id: number;
    propertyId: number;
    lease: {
      tenant: {
        id: number;
        name: string;
      };
      unit: {
        id: number;
        code: string;
      };
    };
    categoryId: number | null;
    employeeId: number | null;
    status: TicketStatus;
    priority: TicketPriority;
    title: string;
    description: string | null;
  };
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

export default function TicketUpdateForm({ data, properties, categories }: TicketUpdateFormProps) {
  const router = useRouter();

  const initialPropertyId = String(data.propertyId);
  const propertyName = properties.find((p) => p.id === data.propertyId)?.name ?? String(data.propertyId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: data.categoryId ? String(data.categoryId) : "",
      employeeId: data.employeeId ? String(data.employeeId) : "",
      status: data.status,
      priority: data.priority,
      title: data.title,
      description: data.description ?? "",
    },
  });

  const {
    employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useLeanEmployees({
    propertyId: initialPropertyId,
    role: UserRole.worker,
  });

  const isLoadingOptions = isLoadingEmployees;

  useEffect(() => {
    if (employeesError) {
      toast.error("Failed to load employees");
    }
  }, [employeesError]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(data.id));
    formData.append("categoryId", values.categoryId ?? "");
    if (values.employeeId) {
      formData.append("employeeId", values.employeeId);
    }
    formData.append("status", values.status);
    formData.append("priority", values.priority);
    formData.append("title", values.title);
    if (values.description) {
      formData.append("description", values.description);
    }

    const result = await updateTicketAction(formData);

    if (result.success) {
      router.push("/admin/tickets");
      toast.success("Ticket updated successfully");
    } else {
      toast.error(result.message || "Failed to update ticket");
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Property</FieldLabel>
              <Input value={propertyName} disabled />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Tenant</FieldLabel>
                <Input value={data.lease.tenant.name} disabled />
              </Field>

              <Field>
                <FieldLabel>Unit</FieldLabel>
                <Input value={data.lease.unit.code} disabled />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Category</FieldLabel>
                    <div className="flex items-center gap-1">
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={categories.length === 0}
                      >
                        <SelectTrigger className="w-full flex-1">
                          <SelectValue placeholder={categories.length === 0 ? "No categories" : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => field.onChange("")}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1">
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        disabled={isLoadingOptions || employees.length === 0}
                      >
                        <SelectTrigger className="w-full flex-1">
                          <SelectValue
                            placeholder={
                              isLoadingOptions
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
                      {field.value && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => field.onChange("")}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
