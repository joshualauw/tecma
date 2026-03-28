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
import { deleteUnitAction } from "@/lib/actions/units/delete-unit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnits } from "@/hooks/swr/units/use-units";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UnitApiItem } from "@/app/api/units/route";
import { ColumnDef, PaginationState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/lib/integrations/dayjs";
import { DATA_TABLE_PAGE_SIZE } from "@/lib/constants";

interface UnitsDataTableProps {
  properties: {
    id: number;
    name: string;
  }[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

export default function UnitsDataTable({ properties, permissions }: UnitsDataTableProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_PAGE_SIZE,
  });
  const [unitToDelete, setUnitToDelete] = useState<UnitApiItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: apiData,
    error,
    isLoading,
    mutate,
  } = useUnits({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: globalFilter,
    propertyId: selectedPropertyId,
  });

  const data = apiData?.units ?? [];
  const totalCount = apiData?.count ?? 0;

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize],
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch units");
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

  const columns: ColumnDef<UnitApiItem>[] = useMemo(() => {
    const base: ColumnDef<UnitApiItem>[] = [
      {
        id: "row",
        header: "Row",
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "code",
        header: "Code",
      },
      {
        id: "property",
        header: "Property",
        cell: ({ row }) => row.original.property.name,
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
          const value = row.original.createdAt;
          return (
            <div className="leading-tight">
              <p>{dayjs(value).format("DD/MM/YYYY HH:mm")}</p>
              <p className="text-xs text-muted-foreground">{row.original.createdBy?.name ?? "-"}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Updated At",
        cell: ({ row }) => {
          const value = row.original.updatedAt;
          return (
            <div className="leading-tight">
              <p>{dayjs(value).format("DD/MM/YYYY HH:mm")}</p>
              <p className="text-xs text-muted-foreground">{row.original.updatedBy?.name ?? "-"}</p>
            </div>
          );
        },
      },
    ];

    if (!permissions.canEdit && !permissions.canDelete) {
      return base;
    }

    base.push({
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
            {permissions.canEdit && (
              <DropdownMenuItem onSelect={() => router.push(`/admin/units/update/${row.original.id}`)}>
                Edit
              </DropdownMenuItem>
            )}
            {permissions.canDelete && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setUnitToDelete(row.original);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return base;
  }, [permissions.canDelete, permissions.canEdit, router]);

  async function onConfirmDelete() {
    if (!unitToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteUnitAction(unitToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      setUnitToDelete(null);
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
              placeholder="Search by code..."
              className="sm:max-w-sm"
            />
            <Select
              value={selectedPropertyId}
              onValueChange={(value) => {
                setSelectedPropertyId(value);
                setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={String(property.id)}>
                    {property.name}
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
                      {isLoading ? "Loading..." : error ? "Failed to load units." : "No units found."}
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
            setUnitToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting <strong>{unitToDelete?.code ?? "this unit"}</strong> will
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
