"use client";
"use no memo";

import type { RoomApiItem } from "@/app/api/rooms/route";
import { resolveRoomAction } from "@/lib/actions/rooms/resolve-room";
import { sendMessageAction } from "@/lib/actions/messages/send-message";
import { validateMessageAttachment, type MessageAttachmentType } from "@/lib/constants";
import { MessageType, RoomStatus } from "@/generated/prisma/enums";
import { useMessages } from "@/hooks/swr/messages/use-messages";
import { useRoomDetail } from "@/hooks/swr/rooms/use-room-detail";
import { useRooms } from "@/hooks/swr/rooms/use-rooms";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageApiItem } from "@/app/api/messages/route";
import { MessageStatusUpdate } from "@/lib/handlers/message/status";
import type { InboxPermissions } from "@/components/admin/inbox/providers/inbox-context";

export interface UseInboxStateProps {
  properties: {
    id: number;
    name: string;
  }[];
  permissions: InboxPermissions;
}

export function useInboxState({ properties, permissions }: UseInboxStateProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<"all" | RoomStatus>(RoomStatus.active);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isRoomDataOpen, setIsRoomDataOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isResolvingRoom, setIsResolvingRoom] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<MessageAttachmentType | null>(null);
  const [replyWaId, setReplyWaId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const previewUrl = useMemo(() => {
    if (attachmentFile && (attachmentType === "image" || attachmentType === "video")) {
      return URL.createObjectURL(attachmentFile);
    }
    return null;
  }, [attachmentFile, attachmentType]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearAttachment = useCallback(() => {
    setAttachmentFile(null);
    setAttachmentType(null);
  }, []);

  const clearDraftMessage = useCallback(() => {
    setDraftMessage("");
  }, []);

  const setAttachmentFromFile = useCallback((type: MessageAttachmentType, file: File) => {
    const result = validateMessageAttachment({ type: file.type, size: file.size, name: file.name }, type);
    if (!result.valid) {
      toast.error(result.error);
      return;
    }
    setAttachmentFile(file);
    setAttachmentType(type);

    if (type === "audio") {
      clearDraftMessage();
    }
  }, []);

  const clearReply = useCallback(() => {
    setReplyWaId(null);
    setReplyContent("");
  }, []);

  const setReplyToMessage = useCallback((waId: string | null, content: string) => {
    setReplyWaId(waId);
    setReplyContent(content);
  }, []);

  useEffect(() => {
    clearDraftMessage();
    clearAttachment();
    clearReply();
  }, [selectedRoomId, clearAttachment, clearDraftMessage, clearReply]);

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

  async function onSendMessage(content: string, messageType: MessageType, file?: File): Promise<void> {
    if (!isRoomActive || selectedRoomId === null || isSendingMessage) {
      return;
    }

    const propertyId = roomDetail?.tenant?.property.id;
    if (!propertyId) {
      toast.error("Failed to send message");
      return;
    }

    try {
      setIsSendingMessage(true);

      const formData = new FormData();
      formData.set("content", content);
      formData.set("roomId", String(selectedRoomId));
      formData.set("propertyId", String(propertyId));
      formData.set("messageType", messageType);
      if (replyWaId) {
        formData.set("replyWaId", replyWaId);
      }

      if (file) {
        formData.set("file", file);
        if (messageType === MessageType.document) {
          formData.set("filename", file.name);
        }
      }

      const result = await sendMessageAction(formData);

      if (!result.success) {
        toast.error(result.message || "Failed to send message");
        return;
      }

      clearDraftMessage();
      clearAttachment();
      clearReply();

      return;
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
      return;
    } finally {
      setIsSendingMessage(false);
    }
  }

  const appendNewMessage = useCallback((message: MessageApiItem) => {
    mutateMessages(
      (current) => {
        if (!current) return current;
        return { ...current, messages: [...current.messages, message] };
      },
      { revalidate: false },
    );
  }, []);

  const appendNewRoom = useCallback((room: RoomApiItem) => {
    mutateRooms(
      (current) => {
        if (!current) return current;
        return { ...current, rooms: [...current.rooms, room] };
      },
      { revalidate: false },
    );
  }, []);

  const updateMessageStatus = useCallback((messageStatus: MessageStatusUpdate) => {
    mutateMessages(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          messages: current.messages.map((message) =>
            message.id === messageStatus.messageId ? { ...message, status: messageStatus.messageStatus } : message,
          ),
        };
      },
      { revalidate: false },
    );
  }, []);

  const updateRoomList = useCallback((createdMessage: MessageApiItem) => {
    mutateRooms(
      (current) => {
        if (!current) return current;
        const updatedRooms = current.rooms.map((room) => {
          if (room.id === createdMessage.roomId) {
            return {
              ...room,
              lastMessage: createdMessage.content,
              lastMessageAt: createdMessage.createdAt,
            };
          }
          return room;
        });
        const sortedRooms = updatedRooms.sort((a, b) => {
          return new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();
        });
        return { ...current, rooms: sortedRooms };
      },
      { revalidate: false },
    );
  }, []);

  return {
    permissions,
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
    draftMessage,
    setDraftMessage,
    attachmentFile,
    attachmentType,
    previewUrl,
    clearAttachment,
    setAttachmentFromFile,
    replyWaId,
    replyContent,
    setReplyToMessage,
    clearReply,
    appendNewMessage,
    appendNewRoom,
    updateRoomList,
    updateMessageStatus,
  };
}
