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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoles } from "@/hooks/swr/roles/use-roles";
import { deleteRoleAction } from "@/lib/actions/roles/delete-role";
import { DATA_TABLE_PAGE_SIZE } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import type { RoleApiItem } from "@/app/api/roles/route";
import { ColumnDef, PaginationState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatLabel } from "@/lib/utils";

export default function RolesDataTable() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_PAGE_SIZE,
  });
  const [roleToDelete, setRoleToDelete] = useState<RoleApiItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: apiData,
    error,
    isLoading,
    mutate,
  } = useRoles({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: globalFilter,
  });

  const data = apiData?.roles ?? [];
  const totalCount = apiData?.count ?? 0;

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize],
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch roles");
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

  async function onConfirmDelete() {
    if (!roleToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteRoleAction(roleToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
      await mutate();
    } else {
      toast.error(result.message);
    }

    setIsDeleting(false);
  }

  const columns: ColumnDef<RoleApiItem>[] = [
    {
      id: "row",
      header: "Row",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => formatLabel(row.original.name),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <div className="leading-tight">
          <p>{dayjs(row.original.createdAt).format("DD/MM/YYYY HH:mm")}</p>
          <p className="text-xs text-muted-foreground">{row.original.createdBy?.name ?? "-"}</p>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => (
        <div className="leading-tight">
          <p>{dayjs(row.original.updatedAt).format("DD/MM/YYYY HH:mm")}</p>
          <p className="text-xs text-muted-foreground">{row.original.updatedBy?.name ?? "-"}</p>
        </div>
      ),
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
              onSelect={() => router.push(`/admin/roles/update/${row.original.id}`)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setRoleToDelete(row.original);
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
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name"
            className="sm:max-w-sm"
          />

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
                      {isLoading ? "Loading..." : error ? "Failed to load roles." : "No roles found."}
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
            setRoleToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting <strong>{roleToDelete?.name ?? "this role"}</strong> will
              permanently remove it and everything related to it.
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
