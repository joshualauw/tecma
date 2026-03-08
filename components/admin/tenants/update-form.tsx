"use client";

import { AvailableUnitsApiItem, AvailableUnitsApiResponse } from "@/app/api/units/available/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateTenantAction } from "@/lib/actions/tenants/update-tenant";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Tenant name is required"),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number format")
    .trim()
    .min(1, "Phone number is required"),
  address: z.string().trim().optional(),
  propertyId: z.string().trim().min(1, "Property is required"),
  unitId: z.string().trim().min(1, "Unit is required"),
});

interface TenantUpdateFormProps {
  data: {
    id: number;
    name: string;
    phoneNumber: string;
    address: string | null;
    propertyId: number | null;
    unitId: number | null;
  };
  properties: {
    id: number;
    name: string;
  }[];
}

export default function TenantUpdateForm({ data, properties }: TenantUpdateFormProps) {
  const { id, name, phoneNumber, address, propertyId, unitId } = data;
  const router = useRouter();
  const [availableUnits, setAvailableUnits] = useState<AvailableUnitsApiItem[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      phoneNumber,
      address: address ?? "",
      propertyId: propertyId ? String(propertyId) : "",
      unitId: unitId ? String(unitId) : "",
    },
  });

  const selectedPropertyId = form.watch("propertyId");

  useEffect(() => {
    const property = Number(selectedPropertyId);

    if (!Number.isInteger(property) || property <= 0) {
      form.setValue("unitId", "");
      setAvailableUnits([]);
      return;
    }

    if (property !== propertyId) {
      form.setValue("unitId", "");
    }

    const controller = new AbortController();

    async function fetchAvailableUnits() {
      setIsLoadingUnits(true);

      try {
        const response = await fetch(`/api/units/available?propertyId=${property}&tenantId=${id}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as AvailableUnitsApiResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to fetch available units");
        }

        setAvailableUnits(payload.data?.units ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setAvailableUnits([]);
        toast.error("Failed to load available units");
      } finally {
        setIsLoadingUnits(false);
      }
    }

    fetchAvailableUnits();

    return () => {
      controller.abort();
    };
  }, [form, id, propertyId, selectedPropertyId]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("name", data.name);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("address", data.address ?? "");
    formData.append("propertyId", data.propertyId);
    formData.append("unitId", data.unitId);

    const result = await updateTenantAction(formData);
    if (result.success) {
      router.push("/admin/tenants");
      toast.success("Tenant updated successfully");
    } else {
      toast.error(result.message || "Failed to create tenant");
    }
  }

  return (
    <Card className="rounded-sm">
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <Controller
                name="unitId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Unit</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedPropertyId || isLoadingUnits || availableUnits.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !selectedPropertyId
                              ? "Select a property first"
                              : isLoadingUnits
                                ? "Loading units..."
                                : availableUnits.length === 0
                                  ? "No available units"
                                  : "Select a unit"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.code}
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
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Name</FieldLabel>
                    <Input {...field} placeholder="Juan Dela Cruz" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input {...field} placeholder="09171234567" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Address</FieldLabel>
                  <Textarea {...field} className="h-36" placeholder="123 Main Street" />
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
