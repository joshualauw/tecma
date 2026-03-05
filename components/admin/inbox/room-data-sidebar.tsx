"use client";

import type { RoomDetailApiItem } from "@/app/api/rooms/[id]/route";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RoomDataSidebarProps {
  roomDetail: RoomDetailApiItem | null;
  statusBadgeVariant: (_status: RoomDetailApiItem["status"]) => "default" | "secondary" | "destructive";
  formatStatusLabel: (_status: RoomDetailApiItem["status"]) => string;
}

function formatTimestamp(value: Date | string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function RoomDataSidebar({ roomDetail, statusBadgeVariant, formatStatusLabel }: RoomDataSidebarProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className="text-sm font-bold">Room Data</p>
          <div>
            <p className="text-xs text-muted-foreground">Tenant</p>
            <p className="text-sm font-medium">{roomDetail?.tenant?.name ?? "-"}</p>
            <p className="text-sm text-muted-foreground">{roomDetail?.tenant?.phone_number ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">WhatsApp</p>
            <p className="text-sm font-medium">{roomDetail?.whatsapp?.display_name ?? "-"}</p>
            <p className="text-sm text-muted-foreground">{roomDetail?.whatsapp?.phone_number ?? "-"}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-sm font-bold">Room Status</p>
          {roomDetail ? (
            <Badge variant={statusBadgeVariant(roomDetail.status)}>{formatStatusLabel(roomDetail.status)}</Badge>
          ) : (
            <p className="text-sm">-</p>
          )}
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Opened at:</span>{" "}
              {formatTimestamp(roomDetail?.created_at ?? null)}
            </p>
            <p>
              <span className="text-muted-foreground">Expired at:</span>{" "}
              {formatTimestamp(roomDetail?.expired_at ?? null)}
            </p>
            <p>
              <span className="text-muted-foreground">Closed at:</span> {formatTimestamp(roomDetail?.closed_at ?? null)}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-bold">Tickets</p>
        </div>
      </div>
    </div>
  );
}
