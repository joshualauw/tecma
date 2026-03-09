"use client";
"use no memo";

import type { MessageApiItem } from "@/app/api/messages/route";
import { resolveRoomAction } from "@/lib/actions/rooms/resolve-room";
import type { ApiResponse } from "@/types/ApiResponse";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import InboxChat from "@/components/admin/inbox/chat";
import InboxHeader from "@/components/admin/inbox/header";
import InboxInfo from "@/components/admin/inbox/info";
import InboxRooms from "@/components/admin/inbox/rooms";
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

  async function onConfirmResolveRoom() {
    if (selectedRoomId === null) return;
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
          <InboxRooms
            properties={properties}
            rooms={rooms}
            isLoadingRooms={isLoadingRooms}
            roomsError={roomsError}
            selectedPropertyId={selectedPropertyId}
            onSelectedPropertyIdChange={setSelectedPropertyId}
            selectedRoomStatus={selectedRoomStatus}
            onSelectedRoomStatusChange={setSelectedRoomStatus}
            selectedRoomId={selectedRoomId}
            onSelectedRoomIdChange={setSelectedRoomId}
          />

          <div className="flex min-h-0 flex-col">
            {selectedRoomId === null ? (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">Select a room to view chat messages.</p>
              </div>
            ) : (
              <>
                <InboxHeader
                  tenantName={roomDetail?.tenant?.name ?? "Unknown Tenant"}
                  expiredAt={roomDetail?.expiredAt ?? ""}
                  onToggleRoomData={() => setIsRoomDataOpen((prev) => !prev)}
                  isResolveDialogOpen={isResolveDialogOpen}
                  onResolveDialogOpenChange={setIsResolveDialogOpen}
                  onConfirmResolve={onConfirmResolveRoom}
                  isResolvingRoom={isResolvingRoom}
                  isRoomActive={isRoomActive}
                  hasRoomDetail={roomDetail != null}
                  openTicketsCount={roomDetail?.tickets.length ?? 0}
                />

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
                      <InboxInfo roomDetail={roomDetail ?? null} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
