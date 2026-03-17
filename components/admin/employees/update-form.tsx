"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateEmployeeAction } from "@/lib/actions/employees/update-employee";
import { PHONE_NUMBER_REGEX } from "@/lib/constants";
import { firstLetterUppercase } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required"),
  email: z.email("Invalid email format").trim().min(1, "Email is required"),
  roleId: z.string().trim().min(1, "Role is required"),
  phoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, "Invalid phone number format")
    .trim()
    .min(1, "Phone number is required"),
  address: z.string().trim().optional(),
});

interface EmployeeUpdateFormProps {
  data: {
    id: number;
    name: string;
    email: string;
    roleId: number;
    phoneNumber: string;
    address: string | null;
  };
  roles: {
    id: number;
    name: string;
  }[];
}

export default function EmployeeUpdateForm({ data, roles }: EmployeeUpdateFormProps) {
  const { id, name, email, roleId, phoneNumber, address } = data;
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      email,
      roleId: roleId.toString(),
      phoneNumber,
      address: address ?? "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("roleId", data.roleId);
    formData.append("phoneNumber", data.phoneNumber);
    if (data.address) {
      formData.append("address", data.address);
    }

    const result = await updateEmployeeAction(formData);
    if (result.success) {
      router.push("/admin/employees");
      toast.success("Employee updated successfully");
    } else {
      toast.error(result.message || "Failed to update employee");
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input {...field} type="email" placeholder="juan@example.com" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="roleId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Role</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {firstLetterUppercase(role.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
