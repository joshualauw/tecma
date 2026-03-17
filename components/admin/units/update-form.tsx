"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateUnitAction } from "@/lib/actions/units/update-unit";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  code: z.string().trim().min(1, "Unit code is required"),
});

interface UnitUpdateFormProps {
  data: {
    id: number;
    code: string;
    property: {
      id: number;
      name: string;
    };
  };
}

export default function UnitUpdateForm({ data }: UnitUpdateFormProps) {
  const { id, code, property } = data;
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("code", data.code);

    const result = await updateUnitAction(formData);
    if (result.success) {
      router.push("/admin/units");
      toast.success("Unit updated successfully");
    } else {
      toast.error(result.message || "Failed to update unit");
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
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Code</FieldLabel>
                  <Input {...field} placeholder="A-101" />
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
