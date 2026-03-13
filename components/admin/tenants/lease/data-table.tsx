"use client";
"use no memo";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TenantLeaseApiItem } from "@/app/api/tenants/leases/[id]/route";
import { useTenantLeases } from "@/lib/fetching/leases/use-tenant-leases";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { LeaseStatus } from "@/generated/prisma/enums";
import { Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/lib/dayjs";
import UpdateLeaseForm from "@/components/admin/tenants/lease/update-form";

interface TenantLeasesDataTableProps {
  tenantId: number;
}

function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  if (status === LeaseStatus.active) {
    return <Badge variant="success">Active</Badge>;
  }
  if (status === LeaseStatus.expired) {
    return <Badge variant="secondary">Expired</Badge>;
  }
  return <Badge variant="destructive">Terminated</Badge>;
}

export default function TenantLeasesDataTable({ tenantId }: TenantLeasesDataTableProps) {
  const [leaseToEdit, setLeaseToEdit] = useState<TenantLeaseApiItem | null>(null);
  const { data: apiData, error, isLoading } = useTenantLeases(tenantId);

  const data = apiData?.leases ?? [];

  const columns: ColumnDef<TenantLeaseApiItem>[] = [
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
      id: "unit",
      header: "Unit",
      cell: ({ row }) => row.original.unit.code,
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: ({ row }) => row.original.tenant.name,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => dayjs(row.original.startDate).format("DD/MM/YYYY"),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => dayjs(row.original.endDate).format("DD/MM/YYYY"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <LeaseStatusBadge status={row.original.status} />,
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
            <DropdownMenuItem onSelect={() => setLeaseToEdit(row.original)}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch leases");
    }
  }, [error]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
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
                      {isLoading ? "Loading..." : error ? "Failed to load leases." : "No leases found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {leaseToEdit && (
        <UpdateLeaseForm
          lease={leaseToEdit}
          open={true}
          onOpenChange={() => setLeaseToEdit(null)}
          tenantId={tenantId}
        />
      )}
    </>
  );
}
