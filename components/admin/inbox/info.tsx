"use client";

import type { RoomDetailApiItem } from "@/app/api/rooms/[id]/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { RoomStatus, TicketStatus } from "@/generated/prisma/enums";
import { HouseHeartIcon, MapPinIcon, PhoneIcon, PlusIcon } from "lucide-react";
import dayjs from "@/lib/dayjs";

function formatStatusLabel(status: RoomStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeVariant(status: RoomStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "secondary";
    case "closed":
      return "default";
    case "expired":
      return "destructive";
  }
}

function formatTimestamp(value: Date | string | null) {
  if (!value) {
    return "-";
  }

  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

function formatTicketStatusLabel(status: TicketStatus) {
  if (status === "in_progress") {
    return "In Progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTicketPriorityLabel(priority: RoomDetailApiItem["tickets"][number]["priority"]) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function ticketStatusBadgeVariant(status: TicketStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case "open":
      return "secondary";
    case "in_progress":
      return "default";
    case "closed":
      return "destructive";
  }
}

export default function InboxInfo() {
  const { roomDetail } = useInbox();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <p className="text-sm font-bold">Room Data</p>
          <div>
            <p className="text-xs text-muted-foreground">Tenant</p>
            <p className="text-sm font-medium mb-1">{roomDetail?.tenant.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <PhoneIcon className="size-3" />
              {roomDetail?.tenant.phoneNumber}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3" />
              {roomDetail?.tenant.property.name}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <HouseHeartIcon className="size-3" />
              {roomDetail?.tenant.unit.code}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">WhatsApp</p>
            <p className="text-sm font-medium mb-1">{roomDetail?.whatsapp?.displayName ?? "-"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <PhoneIcon className="size-3" />
              {roomDetail?.whatsapp?.phoneNumber ?? "-"}
            </p>
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
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">Opened at:</span>
            <span>{formatTimestamp(roomDetail?.createdAt ?? null)}</span>

            <span className="text-muted-foreground">Expired at:</span>
            <span>{formatTimestamp(roomDetail?.expiredAt ?? null)}</span>

            <span className="text-muted-foreground">Closed at:</span>
            <span>{formatTimestamp(roomDetail?.closedAt ?? null)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Tickets</p>
            <Button size="sm" asChild>
              <a href="/admin/tickets/create" target="_blank" rel="noreferrer">
                <PlusIcon /> Add
              </a>
            </Button>
          </div>

          {roomDetail?.tickets.length ? (
            <div className="space-y-2">
              {roomDetail.tickets.map((ticket) => (
                <a
                  key={ticket.id}
                  href={`/admin/tickets/update/${ticket.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border p-3 text-sm transition-colors hover:bg-muted"
                >
                  <p className="font-medium">{ticket.title}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Category: {ticket.category?.name ?? "-"}</p>
                    <p>Priority: {formatTicketPriorityLabel(ticket.priority)}</p>
                    <p>Employee: {ticket.employee?.name ?? "-"}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant={ticketStatusBadgeVariant(ticket.status)}>
                      {formatTicketStatusLabel(ticket.status)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(ticket.createdAt)}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tickets found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
