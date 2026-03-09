"use client";
"use no memo";

import type { MessageApiItem } from "@/app/api/messages/route";
import { resolveRoomAction } from "@/lib/actions/rooms/resolve-room";
import type { ApiResponse } from "@/types/ApiResponse";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import dayjs from "dayjs";
import { AlertTriangleIcon, FilterIcon, PanelRightOpenIcon, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import InboxChat from "@/components/admin/inbox/chat";
import InboxInfo from "@/components/admin/inbox/info";
import { RoomStatus } from "@/generated/prisma/enums";
import { useMessages } from "@/lib/fetching/messages/use-messages";
import { useRoomDetail } from "@/lib/fetching/rooms/use-room-detail";
import { useRooms } from "@/lib/fetching/rooms/use-rooms";

interface InboxContainerProps {
  properties: {
    id: number;
    name: string;
  }[];
}

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
  const diff = dayjs(value).diff(dayjs());

  if (diff <= 0) {
    return "Expired";
  }

  const d = dayjs.duration(diff);
  const days = d.days();
  const hours = d.hours();
  const minutes = d.minutes();

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function InboxContainer({ properties }: InboxContainerProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<"all" | RoomStatus>("active");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isRoomDataOpen, setIsRoomDataOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isResolvingRoom, setIsResolvingRoom] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const {
    data: roomsData,
    error: roomsError,
    isLoading: isLoadingRooms,
    mutate: mutateRooms,
  } = useRooms({
    propertyId: selectedPropertyId,
    status: selectedRoomStatus,
  });

  const rooms = roomsData?.rooms ?? [];

  const {
    data: roomDetail,
    error: roomDetailError,
    isLoading: isLoadingRoomDetail,
    mutate: mutateRoomDetail,
  } = useRoomDetail(selectedRoomId);

  const {
    data: messagesData,
    error: messagesError,
    isLoading: isLoadingMessages,
    mutate: mutateMessages,
  } = useMessages(selectedRoomId);

  const messages = messagesData?.messages ?? [];
  const isLoadingRoomData = isLoadingRoomDetail || isLoadingMessages;

  useEffect(() => {
    if (roomsError) {
      toast.error("Failed to fetch rooms");
      setSelectedRoomId(null);
    }
  }, [roomsError]);

  useEffect(() => {
    if (roomDetailError) {
      toast.error("Failed to fetch room detail");
    }
  }, [roomDetailError]);

  useEffect(() => {
    if (messagesError) {
      toast.error("Failed to fetch messages");
    }
  }, [messagesError]);

  useEffect(() => {
    if (selectedRoomId !== null && roomsData && !rooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(null);
    }
  }, [rooms, roomsData, selectedRoomId]);

  const selectedRoom = selectedRoomId === null ? null : (rooms.find((room) => room.id === selectedRoomId) ?? null);
  const currentRoomStatus = roomDetail?.status ?? selectedRoom?.status ?? null;
  const isRoomActive = currentRoomStatus === "active";
  const openTicketsCount = roomDetail?.tickets.length ?? 0;

  async function onConfirmResolveRoom() {
    if (selectedRoomId === null) {
      return;
    }

    try {
      setIsResolvingRoom(true);

      const result = await resolveRoomAction(selectedRoomId);

      if (result.success) {
        toast.success("Room resolved successfully");
        setIsResolveDialogOpen(false);

        await Promise.all([mutateRooms(), mutateRoomDetail(), mutateMessages()]);
      } else {
        toast.error(result.message || "Failed to resolve room");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve room");
    } finally {
      setIsResolvingRoom(false);
    }
  }

  async function onSendMessage(content: string) {
    if (!isRoomActive || selectedRoomId === null || isSendingMessage) {
      return false;
    }

    const propertyId = roomDetail?.tenant?.property?.id;

    if (!propertyId) {
      toast.error("Failed to send message");
      return false;
    }

    try {
      setIsSendingMessage(true);

      const response = await fetch("/api/messages/send", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          roomId: selectedRoomId,
          propertyId,
        }),
      });

      const payload = (await response.json()) as ApiResponse<MessageApiItem>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to send message");
      }

      const createdMessage = payload.data;

      await Promise.all([
        mutateMessages(
          (current) => {
            if (!current) return current;
            return {
              ...current,
              messages: [...current.messages, createdMessage],
            };
          },
          { revalidate: false },
        ),
        mutateRooms(
          (current) => {
            if (!current) return current;
            return {
              ...current,
              rooms: current.rooms.map((room) =>
                room.id === selectedRoomId
                  ? {
                      ...room,
                      lastMessage: createdMessage.content,
                      lastMessageAt: createdMessage.createdAt,
                    }
                  : room,
              ),
            };
          },
          { revalidate: false },
        ),
      ]);

      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-sm p-0">
      <CardContent className="p-0">
        <div className="grid h-[calc(100vh-6rem)] min-h-[520px] md:grid-cols-[320px_1fr]">
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
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
                      className={`w-full cursor-pointer border-b px-4 py-2 text-left transition-colors hover:bg-muted ${
                        selectedRoomId === room.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{room.tenant?.name ?? "Unknown Tenant"}</p>
                          <div className="mt-1 mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <PhoneIcon className="size-3" />
                            <span>{room.whatsapp?.displayName ?? "-"}</span>
                          </div>
                          <p className="line-clamp-1 text-sm text-muted-foreground">{room.lastMessage ?? "-"}</p>
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
                      Expires in: {roomDetail?.expiredAt ? formatExpiresIn(roomDetail.expiredAt) : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsResolveDialogOpen(true)}
                      disabled={!roomDetail || !isRoomActive || isResolvingRoom}
                    >
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
                  <InboxChat
                    isRoomDataOpen={isRoomDataOpen}
                    isLoadingRoomData={isLoadingRoomData}
                    messages={messages}
                    isRoomActive={isRoomActive}
                    currentRoomStatus={currentRoomStatus}
                    isSendingMessage={isSendingMessage}
                    onSendMessage={onSendMessage}
                  />

                  {isRoomDataOpen && (
                    <div className="min-h-0 basis-0 grow border-l">
                      <InboxInfo
                        roomDetail={roomDetail ?? null}
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

        <AlertDialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve this room?</AlertDialogTitle>
              <AlertDialogDescription>This will close the room and end the conversation</AlertDialogDescription>
            </AlertDialogHeader>

            {openTicketsCount > 0 && (
              <Alert variant="warning">
                <AlertTriangleIcon />
                <AlertTitle>Open tickets still exist</AlertTitle>
                <AlertDescription>
                  {openTicketsCount} {openTicketsCount === 1 ? "ticket is" : "tickets are"} still open.
                </AlertDescription>
              </Alert>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResolvingRoom}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmResolveRoom} disabled={isResolvingRoom}>
                {isResolvingRoom ? "Resolving..." : "Resolve"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
