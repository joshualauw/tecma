"use client";
"use no memo";

import type { MessagesApiResponse, MessageApiItem } from "@/app/api/messages/route";
import type { RoomDetailApiItem, RoomDetailApiResponse } from "@/app/api/rooms/[id]/route";
import type { RoomsApiResponse, RoomApiItem } from "@/app/api/rooms/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RoomDataSidebar } from "@/components/admin/inbox/room-data-sidebar";
import dayjs from "dayjs";
import { FilterIcon, PanelRightOpenIcon, PhoneIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface InboxChatProps {
  properties: {
    id: number;
    name: string;
  }[];
}

function formatStatusLabel(status: RoomApiItem["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeVariant(status: RoomApiItem["status"]): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "secondary";
    case "closed":
      return "default";
    case "expired":
      return "destructive";
  }
}

function formatLastMessageAt(value: Date | string | null) {
  if (!value) {
    return "-";
  }

  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

function formatLastMessageDate(value: Date | string | null) {
  if (!value) {
    return "-";
  }

  return dayjs(value).format("DD/MM/YYYY");
}

function formatLastMessageTime(value: Date | string | null) {
  if (!value) {
    return "-";
  }

  return dayjs(value).format("HH:mm");
}

function formatExpiresIn(value: Date | string) {
  const expiresAt = new Date(value).getTime();
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function messageBubbleClasses(senderType: MessageApiItem["sender_type"]) {
  if (senderType === "tenant") {
    return "max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground";
  }

  if (senderType === "bot") {
    return "max-w-[80%] rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground";
  }

  return "max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground";
}

export default function InboxChat({ properties }: InboxChatProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<"all" | RoomApiItem["status"]>("all");
  const [rooms, setRooms] = useState<RoomApiItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomDetail, setRoomDetail] = useState<RoomDetailApiItem | null>(null);
  const [messages, setMessages] = useState<MessageApiItem[]>([]);
  const [isLoadingRoomData, setIsLoadingRoomData] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [isRoomDataOpen, setIsRoomDataOpen] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (selectedPropertyId !== "all") {
        params.set("propertyId", selectedPropertyId);
      }

      if (selectedRoomStatus !== "all") {
        params.set("status", selectedRoomStatus);
      }

      const queryString = params.toString();
      const response = await fetch(`/api/rooms${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }

      const payload = (await response.json()) as RoomsApiResponse;

      if (!payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to fetch rooms");
      }

      setRooms(payload.data.rooms);

      if (selectedRoomId !== null && !payload.data.rooms.some((room) => room.id === selectedRoomId)) {
        setSelectedRoomId(null);
        setRoomDetail(null);
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch rooms");
      setRooms([]);
      setSelectedRoomId(null);
      setRoomDetail(null);
      setMessages([]);
    }
  }, [selectedPropertyId, selectedRoomId, selectedRoomStatus]);

  const fetchRoomData = useCallback(async () => {
    if (selectedRoomId === null) {
      setRoomDetail(null);
      setMessages([]);
      return;
    }

    try {
      setIsLoadingRoomData(true);

      const [roomResponse, messagesResponse] = await Promise.all([
        fetch(`/api/rooms/${selectedRoomId}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/messages?roomId=${selectedRoomId}`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      if (!roomResponse.ok) {
        throw new Error("Failed to fetch room detail");
      }

      if (!messagesResponse.ok) {
        throw new Error("Failed to fetch messages");
      }

      const roomPayload = (await roomResponse.json()) as RoomDetailApiResponse;
      const messagesPayload = (await messagesResponse.json()) as MessagesApiResponse;

      if (!roomPayload.success || !roomPayload.data) {
        throw new Error(roomPayload.message || "Failed to fetch room detail");
      }

      if (!messagesPayload.success || !messagesPayload.data) {
        throw new Error(messagesPayload.message || "Failed to fetch messages");
      }

      setRoomDetail(roomPayload.data);
      setMessages(messagesPayload.data.messages);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch chat data");
      setRoomDetail(null);
      setMessages([]);
    } finally {
      setIsLoadingRoomData(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    void fetchRoomData();
  }, [fetchRoomData]);

  return (
    <div className="space-y-4">
      <div className="grid h-[calc(100vh-7.5rem)] min-h-[520px] overflow-hidden rounded-md border bg-background md:grid-cols-[320px_1fr]">
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
                      onValueChange={(value: "all" | RoomApiItem["status"]) => setSelectedRoomStatus(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedPropertyId("all");
                        setSelectedRoomStatus("all");
                      }}
                    >
                      Clear
                    </Button>
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
                    className={`w-full cursor-pointer border-b px-4 py-2 text-left transition-colors hover:bg-muted ${
                      selectedRoomId === room.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{room.tenant?.name ?? "Unknown Tenant"}</p>
                        <div className="mt-1 mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <PhoneIcon className="size-3" />
                          <span>{room.whatsapp?.display_name ?? "-"}</span>
                        </div>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{room.last_message ?? "-"}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <Badge className="mb-3" variant={statusBadgeVariant(room.status)}>
                          {formatStatusLabel(room.status)}
                        </Badge>
                        <p>{formatLastMessageDate(room.last_message_at)}</p>
                        <p>{formatLastMessageTime(room.last_message_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
                No rooms found.
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          {selectedRoomId === null ? (
            <div className="flex h-full items-center justify-center p-6">
              <p className="text-sm text-muted-foreground">Select a room to view chat messages.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div onClick={() => setIsRoomDataOpen((prev) => !prev)} className="cursor-pointer">
                  <p className="text-sm font-semibold">{roomDetail?.tenant?.name ?? "Unknown Tenant"}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires in {roomDetail?.expired_at ? formatExpiresIn(roomDetail.expired_at) : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm">
                    Resolve
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Open room data"
                    onClick={() => setIsRoomDataOpen((prev) => !prev)}
                    disabled={!roomDetail}
                  >
                    <PanelRightOpenIcon />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="min-h-0 flex flex-1">
                <div className={`flex min-h-0 flex-col ${isRoomDataOpen ? "basis-0 grow-[2]" : "flex-1"}`}>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                    {isLoadingRoomData ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Loading chat...
                      </div>
                    ) : messages.length ? (
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === "tenant" ? "justify-start" : "justify-end"}`}
                          >
                            <div className={messageBubbleClasses(message.sender_type)}>
                              <p>{message.content}</p>
                              <p className="mt-1 text-[10px] opacity-80">{formatLastMessageAt(message.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No messages yet.
                      </div>
                    )}
                  </div>

                  <Separator />

                  <form
                    className="flex items-center gap-2 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <Input
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Type a message..."
                    />
                    <Button type="submit">Send</Button>
                  </form>
                </div>

                {isRoomDataOpen && (
                  <div className="min-h-0 basis-0 grow border-l">
                    <RoomDataSidebar
                      roomDetail={roomDetail}
                      formatStatusLabel={formatStatusLabel}
                      statusBadgeVariant={statusBadgeVariant}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
