"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui2/date-picker";
import { createLeaseAction } from "@/lib/actions/leases/create-lease";
import { useAvailableUnits } from "@/hooks/swr/units/use-available-units";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import z from "zod";
import dayjs from "@/lib/dayjs";

const formSchema = z
  .object({
    unitId: z.string().trim().min(1, "Unit is required"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  })
  .refine((data) => data.startDate != null, { message: "Start date is required", path: ["startDate"] })
  .refine((data) => data.endDate != null, { message: "End date is required", path: ["endDate"] })
  .refine((data) => data.startDate != null && data.endDate != null && data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof formSchema>;

interface CreateLeaseFormProps {
  tenantId: number;
  propertyId: number;
}

export default function CreateLeaseForm({ tenantId, propertyId }: CreateLeaseFormProps) {
  const [open, setOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const { units: availableUnits, isLoading: isLoadingUnits } = useAvailableUnits({
    propertyId: String(propertyId),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitId: "",
      startDate: dayjs().toDate(),
      endDate: dayjs().add(1, "year").toDate(),
    },
  });

  async function onSubmit(data: FormValues) {
    if (data.startDate == null || data.endDate == null) return;
    const formData = new FormData();
    formData.append("unitId", data.unitId);
    formData.append("startDate", data.startDate.toISOString());
    formData.append("endDate", data.endDate.toISOString());
    formData.append("tenantId", String(tenantId));
    formData.append("propertyId", String(propertyId));

    const result = await createLeaseAction(formData);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      form.reset({ unitId: "", startDate: dayjs().toDate(), endDate: dayjs().add(1, "year").toDate() });
      void mutate(`/api/tenants/${tenantId}/leases`);
      void mutate(`/api/units/available?propertyId=${propertyId}`);
    } else {
      toast.error(result.message ?? "Failed to create lease");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <Plus className="h-4 w-4" /> Create Lease
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lease</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="unitId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Unit</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingUnits || availableUnits.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingUnits
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Start Date</FieldLabel>
                    <DatePicker date={field.value ?? new Date()} setDate={(d) => field.onChange(d)} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="endDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>End Date</FieldLabel>
                    <DatePicker date={field.value ?? new Date()} setDate={(d) => field.onChange(d)} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
