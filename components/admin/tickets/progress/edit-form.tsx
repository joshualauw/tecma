"use client";

import type { TicketProgressApiItem } from "@/app/api/tickets/[id]/progress/route";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTicketProgressAction } from "@/lib/actions/ticket-progress/update-ticket-progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import z from "zod";

const formSchema = z.object({
  comment: z.string().trim(),
  file: z.custom<File | undefined>().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TicketProgressEditFormProps {
  item: TicketProgressApiItem;
  ticketId: number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

export default function TicketProgressEditForm({ item, ticketId, open, onOpenChange }: TicketProgressEditFormProps) {
  const { mutate } = useSWRConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comment: item.comment ?? "",
      file: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        comment: item.comment ?? "",
        file: undefined,
      });
    }
  }, [open, item.id, item.comment, form.reset]);

  async function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.append("id", String(item.id));
    formData.append("comment", data.comment);
    if (data.file instanceof File && data.file.size > 0) {
      formData.append("file", data.file);
    }

    const result = await updateTicketProgressAction(formData);
    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
      await mutate(`/api/tickets/${ticketId}/progress`);
    } else {
      toast.error(result.message ?? "Failed to update progress");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit ticket progress</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {item.imageUrl && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Current attachment</p>
                <img src={item.imageUrl} alt="" className="max-h-40 w-full rounded-md border object-contain" />
              </div>
            )}
            <Controller
              name="comment"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Comment</FieldLabel>
                  <Textarea {...field} placeholder="Progress details" rows={4} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="file"
              control={form.control}
              render={({ field: { onChange, onBlur, name, ref }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{item.imageUrl ? "Replace attachment" : "Attachment"}</FieldLabel>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
