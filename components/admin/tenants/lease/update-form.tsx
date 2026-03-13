"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui2/date-picker";
import type { TenantLeaseApiItem } from "@/app/api/tenants/leases/[id]/route";
import { LeaseStatus } from "@/generated/prisma/enums";
import { updateLeaseAction } from "@/lib/actions/leases/update-lease";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSWRConfig } from "swr";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import dayjs from "@/lib/dayjs";

const formSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
    status: z.enum([LeaseStatus.active, LeaseStatus.expired, LeaseStatus.terminated]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof formSchema>;

const statusOptions = [
  { value: LeaseStatus.active, label: "Active" },
  { value: LeaseStatus.expired, label: "Expired" },
  { value: LeaseStatus.terminated, label: "Terminated" },
] as const;

interface UpdateLeaseFormProps {
  lease: TenantLeaseApiItem;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  tenantId: number;
}

export default function UpdateLeaseForm({ lease, open, onOpenChange, tenantId }: UpdateLeaseFormProps) {
  const { mutate } = useSWRConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: dayjs(lease.startDate).toDate(),
      endDate: dayjs(lease.endDate).toDate(),
      status: lease.status,
    },
  });

  async function onSubmit(data: FormValues) {
    if (lease == null) return;
    const formData = new FormData();
    formData.append("id", String(lease.id));
    formData.append("startDate", data.startDate.toISOString());
    formData.append("endDate", data.endDate.toISOString());
    formData.append("status", data.status);

    const result = await updateLeaseAction(formData);
    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      void mutate(`/api/tenants/leases/${tenantId}`);
      void mutate(`/api/units/available?propertyId=${lease.property.id}`);
    } else {
      toast.error(result.message ?? "Failed to update lease");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Lease</DialogTitle>
        </DialogHeader>
        {lease != null && (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Unit</FieldLabel>
                <Select value={String(lease.unit.id)} disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={String(lease.unit.id)}>{lease.unit.code}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Start Date</FieldLabel>
                      <DatePicker date={field.value} setDate={(d) => field.onChange(d)} />
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
                      <DatePicker date={field.value} setDate={(d) => field.onChange(d)} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
