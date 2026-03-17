"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTenantAction } from "@/lib/actions/tenants/update-tenant";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Tenant name is required"),
  phoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, "Invalid phone number format")
    .trim()
    .min(1, "Phone number is required"),
  address: z.string().trim().optional(),
});

interface TenantUpdateFormProps {
  data: {
    id: number;
    name: string;
    phoneNumber: string;
    address: string | null;
    property: {
      id: number;
      name: string;
    };
  };
}

export default function TenantUpdateForm({ data }: TenantUpdateFormProps) {
  const { id, name, phoneNumber, address, property } = data;
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      phoneNumber,
      address: address ?? "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("name", data.name);
    formData.append("phoneNumber", data.phoneNumber);
    if (data.address) {
      formData.append("address", data.address);
    }

    const result = await updateTenantAction(formData);
    if (result.success) {
      router.push("/admin/tenants");
      toast.success("Tenant updated successfully");
    } else {
      toast.error(result.message || "Failed to update tenant");
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>Property</FieldLabel>
              <Input value={property.name} disabled />
            </Field>
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
