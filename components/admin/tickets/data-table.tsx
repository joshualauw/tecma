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
import type { TicketApiItem } from "@/app/api/tickets/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTickets } from "@/hooks/swr/tickets/use-tickets";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteTicketAction } from "@/lib/actions/tickets/delete-ticket";
import { ColumnDef, PaginationState, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "@/lib/integrations/dayjs";
import { DATA_TABLE_PAGE_SIZE } from "@/lib/constants";
import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";

interface TicketsDataTableProps {
  properties: {
    id: number;
    name: string;
  }[];
  categories: {
    id: number;
    name: string;
  }[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canViewProgress: boolean;
  };
}

function formatStatusLabel(status: TicketStatus) {
  switch (status) {
    case TicketStatus.open:
      return "Open";
    case TicketStatus.in_progress:
      return "In Progress";
    case TicketStatus.closed:
      return "Closed";
    default:
      return "Unknown";
  }
}

function formatPriorityLabel(priority: TicketPriority) {
  switch (priority) {
    case TicketPriority.low:
      return "Low";
    case TicketPriority.medium:
      return "Medium";
    case TicketPriority.high:
      return "High";
    default:
      return "Unknown";
  }
}

function statusBadgeVariant(status: TicketStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case TicketStatus.open:
      return "secondary";
    case TicketStatus.in_progress:
      return "default";
    case TicketStatus.closed:
      return "destructive";
    default:
      return "default";
  }
}

function priorityBadgeVariant(priority: TicketPriority): "secondary" | "default" | "destructive" {
  switch (priority) {
    case TicketPriority.low:
      return "secondary";
    case TicketPriority.medium:
      return "default";
    case TicketPriority.high:
      return "destructive";
    default:
      return "default";
  }
}

export default function TicketsDataTable({ properties, categories, permissions }: TicketsDataTableProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_PAGE_SIZE,
  });
  const [ticketToDelete, setTicketToDelete] = useState<TicketApiItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: apiData,
    error,
    isLoading,
    mutate,
  } = useTickets({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: globalFilter,
    propertyId: selectedPropertyId,
    categoryId: selectedCategoryId,
    status: selectedStatus,
    priority: selectedPriority,
  });

  const data = apiData?.tickets ?? [];
  const totalCount = apiData?.count ?? 0;

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize],
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch tickets");
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

  const columns: ColumnDef<TicketApiItem>[] = useMemo(() => {
    const base: ColumnDef<TicketApiItem>[] = [
      {
        id: "row",
        header: "Row",
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "title",
        header: "Title",
      },
      {
        id: "property",
        header: "Property",
        cell: ({ row }) => row.original.property.name,
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) => row.original.lease.tenant.name,
      },
      {
        id: "unit",
        header: "Unit",
        cell: ({ row }) => row.original.lease.unit.code,
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => row.original.category?.name ?? "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.original.status)}>{formatStatusLabel(row.original.status)}</Badge>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge variant={priorityBadgeVariant(row.original.priority)}>
            {formatPriorityLabel(row.original.priority)}
          </Badge>
        ),
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

    if (!permissions.canEdit && !permissions.canDelete && !permissions.canViewProgress) {
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
              <DropdownMenuItem onSelect={() => router.push(`/admin/tickets/update/${row.original.id}`)}>
                Edit
              </DropdownMenuItem>
            )}
            {permissions.canViewProgress && (
              <DropdownMenuItem onSelect={() => router.push(`/admin/tickets/progress/${row.original.id}`)}>
                Progress
              </DropdownMenuItem>
            )}
            {permissions.canDelete && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setTicketToDelete(row.original);
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
  }, [permissions.canDelete, permissions.canEdit, permissions.canViewProgress, router]);

  async function onConfirmDelete() {
    if (!ticketToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteTicketAction(ticketToDelete.id);

    if (result.success) {
      toast.success(result.message);
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
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
              placeholder="Search by title, tenant"
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
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => {
                setSelectedCategoryId(value);
                setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value={TicketStatus.open}>Open</SelectItem>
                <SelectItem value={TicketStatus.in_progress}>In Progress</SelectItem>
                <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedPriority}
              onValueChange={(value) => {
                setSelectedPriority(value);
                setPagination((previous) => (previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value={TicketPriority.low}>Low</SelectItem>
                <SelectItem value={TicketPriority.medium}>Medium</SelectItem>
                <SelectItem value={TicketPriority.high}>High</SelectItem>
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
                      {isLoading ? "Loading..." : error ? "Failed to load tickets." : "No tickets found."}
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
            setTicketToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting <strong>{ticketToDelete?.title ?? "this ticket"}</strong> will
              permanently remove it.
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
