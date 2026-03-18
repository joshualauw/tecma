"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateRoleAction } from "@/lib/actions/roles/update-role";
import { AVAILABLE_PERMISSIONS } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
  permissions: z.array(z.string().trim().min(1)),
});

type FormValues = z.infer<typeof formSchema>;

type PermissionGroup = {
  key: string;
  children: { name: string; suffix: string }[];
};

function groupPermissions(permissions: readonly string[]): PermissionGroup[] {
  const map = new Map<string, PermissionGroup>();

  for (const name of permissions) {
    const [parent, ...rest] = name.split(":");
    const suffix = rest.join(":") || name;
    const group = map.get(parent) ?? { key: parent, children: [] };
    group.children.push({ name, suffix });
    map.set(parent, group);
  }

  return Array.from(map.values()).map((g) => ({
    ...g,
    children: g.children.sort((a, b) => a.suffix.localeCompare(b.suffix)),
  }));
}

function formatGroupTitle(key: string) {
  return key.replaceAll("-", " ");
}

function PermissionGroupCheckbox({
  group,
  selected,
  onToggleAll,
  onToggleOne,
}: {
  group: PermissionGroup;
  selected: string[];
  onToggleAll: (_names: string[], _nextChecked: boolean) => void;
  onToggleOne: (_name: string, _nextChecked: boolean) => void;
}) {
  const names = group.children.map((c) => c.name);
  const selectedCount = names.filter((n) => selected.includes(n)).length;
  const allChecked = selectedCount === names.length && names.length > 0;
  const someChecked = selectedCount > 0 && !allChecked;
  const parentRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={parentRef}
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={allChecked}
          onChange={(e) => onToggleAll(names, e.target.checked)}
        />
        <span className="text-sm font-medium capitalize">{formatGroupTitle(group.key)}</span>
        <span className="text-xs text-muted-foreground">
          ({selectedCount}/{names.length})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
        {group.children.map((child) => {
          const checked = selected.includes(child.name);
          return (
            <label key={child.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={checked}
                onChange={(e) => onToggleOne(child.name, e.target.checked)}
              />
              <span className="text-sm">{child.suffix}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface RoleUpdateFormProps {
  data: {
    id: number;
    name: string;
    permissions: string[];
  };
}

export default function RoleUpdateForm({ data }: RoleUpdateFormProps) {
  const { id, name, permissions } = data;
  const router = useRouter();

  const grouped = useMemo(() => groupPermissions(AVAILABLE_PERMISSIONS), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name,
      permissions,
    },
  });

  const selectedPermissions = form.watch("permissions");

  async function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("name", data.name);
    for (const permission of data.permissions) {
      formData.append("permissions", permission);
    }

    const result = await updateRoleAction(formData);
    if (result.success) {
      router.push("/admin/roles");
      toast.success("Role updated successfully");
    } else {
      toast.error(result.message || "Failed to update role");
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Name</FieldLabel>
                  <Input {...field} placeholder="dispatcher" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="permissions"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Permissions</FieldLabel>
                  <div className="space-y-3">
                    {grouped.map((group) => (
                      <PermissionGroupCheckbox
                        key={group.key}
                        group={group}
                        selected={field.value}
                        onToggleAll={(names, nextChecked) => {
                          const set = new Set(field.value);
                          for (const n of names) {
                            if (nextChecked) set.add(n);
                            else set.delete(n);
                          }
                          field.onChange(Array.from(set));
                        }}
                        onToggleOne={(name, nextChecked) => {
                          const set = new Set(field.value);
                          if (nextChecked) set.add(name);
                          else set.delete(name);
                          field.onChange(Array.from(set));
                        }}
                      />
                    ))}
                  </div>
                </Field>
              )}
            />

            <Field>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue("permissions", []);
                    toast.message("Permissions cleared");
                  }}
                  disabled={form.formState.isSubmitting || selectedPermissions.length === 0}
                >
                  Clear permissions
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

