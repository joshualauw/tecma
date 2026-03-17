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
import { useEmployees } from "@/lib/fetching/employees/use-employees";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EmployeeApiItem } from "@/app/api/employees/route";
import { deleteEmployeeAction } from "@/lib/actions/employees/delete-employee";
import { ColumnDef, PaginationState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import { DATA_TABLE_PAGE_SIZE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

function roleBadgeVariant(role: string): "default" | "secondary" {
  switch (role) {
    case "dispatcher":
      return "secondary";
    case "worker":
      return "default";
    default:
      return "default";
  }
}

function formatRoleLabel(role: string) {
  switch (role) {
    case "dispatcher":
      return "Dispatcher";
    case "worker":
      return "Worker";
    default:
      return "Unknown";
  }
}

interface EmployeesDataTableProps {
  roles: {
    id: number;
    name: string;
  }[];
}

export default function EmployeesDataTable({ roles }: EmployeesDataTableProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_PAGE_SIZE,
  });
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeApiItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: apiData,
    error,
    isLoading,
    mutate,
  } = useEmployees({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: globalFilter,
    roleId: selectedRoleId,
  });

  const data = apiData?.employees ?? [];
  const totalCount = apiData?.count ?? 0;

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize],
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch employees");
    }
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextFilter = searchInput.trim();
      setGlobalFilter(nextFilter);
      setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: ColumnDef<EmployeeApiItem>[] = [
    {
      id: "row",
      header: "Row",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => row.original.user.name,
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => row.original.user.email,
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={roleBadgeVariant(row.original.user.role.name)}>
          {formatRoleLabel(row.original.user.role.name)}
        </Badge>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const value = row.original.createdAt;
        return dayjs(value).format("DD/MM/YYYY HH:mm");
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => {
        const value = row.original.updatedAt;
        return dayjs(value).format("DD/MM/YYYY HH:mm");
      },
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
            <DropdownMenuItem onSelect={() => router.push(`/admin/employees/update/${row.original.id}`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(`/admin/employees/permission/${row.original.id}`)}>
              Permissions
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setEmployeeToDelete(row.original);
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

  async function onConfirmDelete() {
    if (!employeeToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteEmployeeAction(employeeToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      await mutate();
    } else {
      toast.error(result.message);
    }

    setIsDeleting(false);
  }

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualFiltering: true,
    state: {
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, phone number..."
              className="sm:max-w-sm"
            />
            <Select
              value={selectedRoleId}
              onValueChange={(value) => {
                setSelectedRoleId(value);
                setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {formatRoleLabel(role.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                      {isLoading ? "Loading..." : error ? "Failed to load employees." : "No employees found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setEmployeeToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting <strong>{employeeToDelete?.user.name ?? "this employee"}</strong>{" "}
              will permanently remove the employee record. The linked user account will remain.
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
