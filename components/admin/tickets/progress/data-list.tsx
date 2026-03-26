"use client";

import type { TicketProgressApiItem } from "@/app/api/tickets/[id]/progress/route";
import TicketProgressEditForm from "@/components/admin/tickets/progress/edit-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketStatus } from "@/generated/prisma/enums";
import { useTicketProgress } from "@/hooks/swr/ticket-progress/use-ticket-progress";
import dayjs from "@/lib/dayjs";
import { formatLabel } from "@/lib/utils";
import { Ellipsis, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface TicketProgressDataListProps {
  ticketId: number;
  canEditProgress: boolean;
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

function ProgressDataListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TicketProgressDataList({ ticketId, canEditProgress }: TicketProgressDataListProps) {
  const { data, error, isLoading } = useTicketProgress({ ticketId });
  const [editingItem, setEditingItem] = useState<TicketProgressApiItem | null>(null);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load ticket progress");
    }
  }, [error]);

  if (isLoading && !data) {
    return <ProgressDataListSkeleton />;
  }

  const items = data?.progress ?? [];

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No progress entries yet. Add one to record a status change.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {editingItem && (
        <TicketProgressEditForm
          key={editingItem.id}
          item={editingItem}
          ticketId={ticketId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
            }
          }}
        />
      )}
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="gap-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusBadgeVariant(item.beforeStatus)}>{formatLabel(item.beforeStatus)}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant={statusBadgeVariant(item.afterStatus)}>{formatLabel(item.afterStatus)}</Badge>
                </span>
              </CardDescription>
              {canEditProgress && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground h-8 w-8 shrink-0"
                    >
                      <Ellipsis className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setEditingItem(item);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>
                Created: <span className="tabular-nums">{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</span> by{" "}
                {item.createdBy?.name ?? "-"}
              </p>
              <p>
                Updated: <span className="tabular-nums">{dayjs(item.updatedAt).format("DD/MM/YYYY HH:mm")}</span> by{" "}
                {item.updatedBy?.name ?? "-"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {item.comment ? (
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{item.comment}</p>
            ) : (
              <p className="text-muted-foreground text-sm italic">No comment</p>
            )}
            {item.imageUrl && (
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                  Attachment
                </p>
                <img src={item.imageUrl} alt="" className="max-h-56 w-full rounded-md border object-contain" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
