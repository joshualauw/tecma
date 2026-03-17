"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPermissionAction } from "@/lib/actions/permissions/create-permission";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import z from "zod";

const formSchema = z.object({
  propertyId: z.string().trim().min(1, "Property is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePermissionFormProps {
  employeeId: number;
  properties: {
    id: number;
    name: string;
  }[];
}

export default function CreatePermissionForm({ employeeId, properties }: CreatePermissionFormProps) {
  const [open, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
    },
  });

  async function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.append("employeeId", String(employeeId));
    formData.append("propertyId", data.propertyId);

    const result = await createPermissionAction(formData);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      form.reset({ propertyId: "" });
      void mutate(`/api/employees/${employeeId}/permissions`);
    } else {
      toast.error(result.message ?? "Failed to create permission");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <Plus className="h-4 w-4" /> Add Permission
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Permission</DialogTitle>
        </DialogHeader>
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
                      <SelectValue
                        placeholder={properties.length === 0 ? "No properties available" : "Select a property"}
                      />
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
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || properties.length === 0}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

