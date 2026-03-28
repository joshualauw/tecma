"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NOTIFICATIONS_PAGE_SIZE } from "@/lib/constants";
import dayjs from "@/lib/integrations/dayjs";
import { formatLabel } from "@/lib/utils";
import { useNotifications } from "@/hooks/swr/notifications/use-notifications";
import { PaginationState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function NotificationsDataListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="gap-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function NotificationsDataList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: NOTIFICATIONS_PAGE_SIZE,
  });

  const {
    data: apiData,
    error,
    isLoading,
    isValidating,
  } = useNotifications({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  const notifications = apiData?.notifications ?? [];
  const totalCount = apiData?.count ?? 0;

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
    [totalCount, pagination.pageSize],
  );

  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  useEffect(() => {
    if (error) {
      toast.error("Failed to load notifications");
    }
  }, [error]);

  if (isLoading && !apiData) {
    return <NotificationsDataListSkeleton />;
  }

  if (notifications.length === 0 && !isValidating) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">No notifications yet.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[calc(100vh-16rem)] overflow-y-auto space-y-3 pr-1">
            {notifications.map((n) => (
              <div key={n.id} className="overflow-hidden">
                <div className="gap-2 border p-2 rounded-md space-y-1.5">
                  <Badge variant="secondary">{formatLabel(n.type)}</Badge>
                  <p className="text-foreground text-sm leading-relaxed">{n.content}</p>
                  <div className="text-muted-foreground space-y-0.5 text-xs">
                    <p>
                      <span className="tabular-nums">{dayjs(n.createdAt).format("DD/MM/YYYY HH:mm")}</span> by{" "}
                      {n.createdBy?.name ?? "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <span className="text-sm text-muted-foreground mr-2">
              Page {pagination.pageIndex + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28"
              disabled={!canPreviousPage || isValidating}
              onClick={() => setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex - 1 }))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-28"
              disabled={!canNextPage || isValidating}
              onClick={() => setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
