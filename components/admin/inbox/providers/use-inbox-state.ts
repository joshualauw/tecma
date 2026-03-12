"use client";
"use no memo";

import type { RoomApiItem } from "@/app/api/rooms/route";
import { resolveRoomAction } from "@/lib/actions/rooms/resolve-room";
import { RoomStatus } from "@/generated/prisma/enums";
import { useMessages } from "@/lib/fetching/messages/use-messages";
import { useRoomDetail } from "@/lib/fetching/rooms/use-room-detail";
import { useRooms } from "@/lib/fetching/rooms/use-rooms";
import { useSendMessage } from "@/lib/mutations/messages/use-send-message";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface UseInboxStateProps {
  properties: {
    id: number;
    name: string;
  }[];
}

export function useInboxState({ properties }: UseInboxStateProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<"all" | RoomStatus>(RoomStatus.active);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isRoomDataOpen, setIsRoomDataOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isResolvingRoom, setIsResolvingRoom] = useState(false);

  const { trigger: sendMessage, isMutating: isSendingMessage } = useSendMessage();

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

  const selectedRoom: RoomApiItem | null =
    selectedRoomId === null ? null : (rooms.find((room) => room.id === selectedRoomId) ?? null);
  const currentRoomStatus: RoomStatus | null = roomDetail?.status ?? selectedRoom?.status ?? null;
  const isRoomActive = currentRoomStatus === RoomStatus.active;

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

  async function onSendMessage(content: string): Promise<boolean> {
    if (!isRoomActive || selectedRoomId === null || isSendingMessage) {
      return false;
    }

    const propertyId = roomDetail?.tenant?.property.id;
    if (!propertyId) {
      toast.error("Failed to send message");
      return false;
    }

    try {
      const createdMessage = await sendMessage({
        content,
        roomId: selectedRoomId,
        propertyId,
      });

      await Promise.all([
        mutateMessages(
          (current) => {
            if (!current) return current;
            return { ...current, messages: [...current.messages, createdMessage] };
          },
          { revalidate: false },
        ),
        mutateRooms(
          (current) => {
            if (!current) return current;
            const rooms = current.rooms.map((room) => {
              if (room.id === selectedRoomId) {
                return { ...room, lastMessage: createdMessage.content, lastMessageAt: createdMessage.createdAt };
              }
              return room;
            });
            return { ...current, rooms };
          },
          { revalidate: false },
        ),
      ]);

      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
      return false;
    }
  }

  return {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedRoomStatus,
    setSelectedRoomStatus,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoom,
    rooms,
    roomDetail,
    messages,
    isLoadingRooms,
    roomsError,
    isLoadingRoomData,
    currentRoomStatus,
    isRoomActive,
    isRoomDataOpen,
    setIsRoomDataOpen,
    isResolveDialogOpen,
    setIsResolveDialogOpen,
    isResolvingRoom,
    isSendingMessage,
    onConfirmResolveRoom,
    onSendMessage,
    hasRoomDetail: roomDetail != null,
  };
}
