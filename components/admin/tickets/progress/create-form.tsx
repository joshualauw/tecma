"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTicketProgressAction } from "@/lib/actions/ticket-progress/create-ticket-progress";
import { TicketStatus } from "@/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { formatLabel } from "@/lib/utils";

const formSchema = z.object({
  status: z.enum(TicketStatus),
  comment: z.string().trim().optional(),
  file: z.custom<File | undefined>().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TicketProgressCreateFormProps {
  ticketId: number;
  status: TicketStatus;
}

export default function TicketProgressCreateForm({ ticketId, status }: TicketProgressCreateFormProps) {
  const [open, setOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status,
      comment: "",
      file: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        status,
        comment: "",
        file: undefined,
      });
    }
  }, [open, status, form.reset]);

  async function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.append("ticketId", String(ticketId));
    formData.append("status", data.status);
    if (data.comment) {
      formData.append("comment", data.comment);
    }
    if (data.file instanceof File && data.file.size > 0) {
      formData.append("file", data.file);
    }

    const result = await createTicketProgressAction(formData);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      await mutate(`/api/tickets/${ticketId}/progress`);
    } else {
      toast.error(result.message ?? "Failed to record progress");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <Plus className="h-4 w-4" /> Add progress
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add ticket progress</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                      {Object.values(TicketStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="comment"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Comment</FieldLabel>
                  <Textarea {...field} placeholder="Optional notes" rows={4} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="file"
              control={form.control}
              render={({ field: { onChange, onBlur, name, ref }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Attachment</FieldLabel>
                  <Input
                    ref={ref}
                    name={name}
                    onBlur={onBlur}
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => {
                      onChange(e.target.files?.[0]);
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
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
