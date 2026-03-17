"use client";
"use no memo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EmployeePermissionApiItem } from "@/app/api/employees/[id]/permissions/route";
import { useEmployeePermissions } from "@/lib/fetching/employees/use-employee-permissions";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import { deletePermissionAction } from "@/lib/actions/permissions/delete-permission";
import { useSWRConfig } from "swr";

interface EmployeePermissionsDataTableProps {
  employeeId: number;
}

export default function EmployeePermissionsDataTable({ employeeId }: EmployeePermissionsDataTableProps) {
  const {
    data: apiData,
    error,
    isLoading,
  } = useEmployeePermissions(employeeId);

  const { mutate } = useSWRConfig();
  const [permissionToDelete, setPermissionToDelete] = useState<EmployeePermissionApiItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const data = apiData?.permissions ?? [];

  const columns: ColumnDef<EmployeePermissionApiItem>[] = [
    {
      id: "row",
      header: "Row",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "property",
      header: "Property",
      cell: ({ row }) => row.original.property.name,
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => dayjs(row.original.createdAt).format("DD/MM/YYYY HH:mm"),
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open action menu">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setPermissionToDelete(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch employee permissions");
    }
  }, [error]);

  async function onConfirmDelete() {
    if (!permissionToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deletePermissionAction(permissionToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      setPermissionToDelete(null);
      void mutate(`/api/employees/${employeeId}/permissions`);
    } else {
      toast.error(result.message);
    }

    setIsDeleting(false);
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {isLoading ? "Loading..." : error ? "Failed to load permissions." : "No permissions found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setPermissionToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting this permission will permanently remove it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

