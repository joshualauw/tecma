"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomStatus } from "@/generated/prisma/enums";
import dayjs from "@/lib/integrations/dayjs";
import { FilterIcon, PhoneIcon } from "lucide-react";
import { limitText } from "@/lib/utils";

function formatStatusLabel(status: RoomStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeVariant(status: RoomStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case RoomStatus.active:
      return "secondary";
    case RoomStatus.closed:
      return "default";
    case RoomStatus.expired:
      return "destructive";
  }
}

function formatLastMessageDate(value: Date | string | null) {
  if (!value) return "-";
  return dayjs(value).format("DD/MM/YYYY");
}

function formatLastMessageTime(value: Date | string | null) {
  if (!value) return "-";
  return dayjs(value).format("HH:mm");
}

export default function InboxRooms() {
  const {
    properties,
    rooms,
    isLoadingRooms,
    roomsError,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedRoomStatus,
    setSelectedRoomStatus,
    selectedRoomId,
    setSelectedRoomId,
  } = useInbox();

  return (
    <div className="flex min-h-0 flex-col border-r">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">Rooms</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Total: {rooms.length}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" size="icon-sm" variant="outline" aria-label="Open room filters">
                  <FilterIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-3">
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="w-full">
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
                  value={selectedRoomStatus}
                  onValueChange={(value: "all" | RoomStatus) => setSelectedRoomStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value={RoomStatus.active}>Active</SelectItem>
                    <SelectItem value={RoomStatus.closed}>Closed</SelectItem>
                    <SelectItem value={RoomStatus.expired}>Expired</SelectItem>
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rooms.length ? (
          <div className="p-0">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full cursor-pointer border-b px-4 py-2 text-left transition-colors hover:bg-muted animate-list ${
                  selectedRoomId === room.id ? "bg-muted" : ""
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{room.tenant.name}</p>
                    <div className="mt-1 mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <PhoneIcon className="size-3" />
                      <span>{room.whatsapp.displayName ?? "-"}</span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {limitText(room.lastMessage ?? "-", 100)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <Badge className="mb-3" variant={statusBadgeVariant(room.status)}>
                      {formatStatusLabel(room.status)}
                    </Badge>
                    <p>{formatLastMessageDate(room.lastMessageAt)}</p>
                    <p>{formatLastMessageTime(room.lastMessageAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            {isLoadingRooms ? "Loading..." : roomsError ? "Failed to load rooms." : "No rooms found."}
          </div>
        )}
      </div>
    </div>
  );
}
