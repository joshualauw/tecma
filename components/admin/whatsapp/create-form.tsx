"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWhatsappAction } from "@/lib/actions/whatsapp/create-whatsapp";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required"),
  wabaId: z.string().trim().min(1, "WABA ID is required"),
  phoneId: z.string().trim().min(1, "Phone ID is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  propertyId: z.string().trim().min(1, "Property is required"),
});

interface WhatsappCreateFormProps {
  properties: {
    id: number;
    name: string;
  }[];
}

export default function WhatsappCreateForm({ properties }: WhatsappCreateFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      wabaId: "",
      phoneId: "",
      phoneNumber: "",
      propertyId: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("displayName", data.displayName);
    formData.append("wabaId", data.wabaId);
    formData.append("phoneId", data.phoneId);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("propertyId", data.propertyId);

    const result = await createWhatsappAction(formData);
    if (result.success) {
      router.push("/admin/whatsapp");
      toast.success("WhatsApp created successfully");
    } else {
      form.setError("displayName", { message: result.message });
    }
  }

  return (
    <Card className="rounded-sm">
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
                name="displayName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Display Name</FieldLabel>
                    <Input {...field} placeholder="Tecma Property Chat" />
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
                    <Input {...field} placeholder="+639171234567" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="wabaId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>WABA ID</FieldLabel>
                    <Input {...field} placeholder="123456789012345" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phoneId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone ID</FieldLabel>
                    <Input {...field} placeholder="109876543210987" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
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
