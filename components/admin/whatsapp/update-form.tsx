"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateWhatsappAction } from "@/lib/actions/whatsapp/update-whatsapp";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required"),
  wabaId: z.string().trim().min(1, "WABA ID is required"),
  phoneId: z.string().trim().min(1, "Phone ID is required"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number format")
    .min(1, "Phone number is required"),
});

interface WhatsappUpdateFormProps {
  data: {
    id: number;
    displayName: string;
    wabaId: string;
    phoneId: string;
    phoneNumber: string;
  };
}

export default function WhatsappUpdateForm({ data }: WhatsappUpdateFormProps) {
  const { id, displayName, wabaId, phoneId, phoneNumber } = data;
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName,
      wabaId,
      phoneId,
      phoneNumber,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("displayName", data.displayName);
    formData.append("wabaId", data.wabaId);
    formData.append("phoneId", data.phoneId);
    formData.append("phoneNumber", data.phoneNumber);

    const result = await updateWhatsappAction(formData);
    if (result.success) {
      router.push("/admin/whatsapp");
      toast.success("WhatsApp updated successfully");
    } else {
      toast.error(result.message || "Failed to update WhatsApp");
    }
  }

  return (
    <Card className="rounded-sm">
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
