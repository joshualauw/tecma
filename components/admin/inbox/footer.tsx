"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { MessageType, RoomStatus } from "@/generated/prisma/enums";
import {
  getAcceptString,
  MESSAGE_ATTACHMENT,
  REPLY_PREVIEW_MAX_LENGTH,
  type MessageAttachmentType,
} from "@/lib/constants";
import { FileTextIcon, ImageIcon, MusicIcon, PaperclipIcon, SmileIcon, VideoIcon, XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const ATTACHMENT_TYPE_TO_MESSAGE_TYPE: Record<MessageAttachmentType, MessageType> = {
  image: MessageType.image,
  video: MessageType.video,
  audio: MessageType.audio,
  document: MessageType.document,
};

export default function InboxFooter() {
  const {
    draftMessage,
    setDraftMessage,
    attachmentFile,
    attachmentType,
    setAttachmentFromFile,
    onSendMessage,
    isRoomActive,
    currentRoomStatus,
    isSendingMessage,
    replyWaId,
    replyContent,
    clearReply,
  } = useInbox();

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<Record<MessageAttachmentType, HTMLInputElement | null>>({
    image: null,
    video: null,
    audio: null,
    document: null,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    }
    if (emojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [emojiPickerOpen]);

  const handleAttachmentSelect = useCallback((type: MessageAttachmentType) => {
    const input = fileInputRefs.current[type];
    if (input) {
      input.value = "";
      input.click();
    }
  }, []);

  const handleFileInputChange = useCallback(
    (type: MessageAttachmentType) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setAttachmentFromFile(type, file);
      event.target.value = "";
    },
    [setAttachmentFromFile],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendingMessage) return;

    const content = draftMessage.trim();

    if (attachmentFile && attachmentType) {
      const messageType = ATTACHMENT_TYPE_TO_MESSAGE_TYPE[attachmentType];
      await onSendMessage(content, messageType, attachmentFile);
    } else {
      await onSendMessage(content, MessageType.text);
    }
  }

  if (!isRoomActive) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        Room is {currentRoomStatus === RoomStatus.expired ? "expired" : "closed"}. Messaging is disabled.
      </div>
    );
  }

  return (
    <div className="relative p-4" ref={emojiPickerRef}>
      {emojiPickerOpen && (
        <div className="absolute bottom-full left-4 z-10 mb-2">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setDraftMessage((prev) => prev + emojiData.emoji);
            }}
          />
        </div>
      )}

      {replyWaId && (
        <div className="mb-2 flex items-start gap-2 rounded-md border-l-3 border-primary bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground">Replying to</p>
            <p className="line-clamp-2 break-words text-sm text-foreground">
              {replyContent.length > REPLY_PREVIEW_MAX_LENGTH
                ? `${replyContent.slice(0, REPLY_PREVIEW_MAX_LENGTH)}…`
                : replyContent || "(no text)"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={clearReply} aria-label="Cancel reply">
            <XIcon size={16} />
          </Button>
        </div>
      )}

      {(["image", "video", "audio", "document"] as const).map((type) => (
        <input
          key={type}
          ref={(el) => {
            fileInputRefs.current[type] = el;
          }}
          type="file"
          accept={getAcceptString(type)}
          className="hidden"
          onChange={handleFileInputChange(type)}
        />
      ))}

      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              disabled={isSendingMessage}
              aria-label="Attach file"
            >
              <PaperclipIcon size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onClick={() => handleAttachmentSelect("image")}>
              <ImageIcon size={16} />
              Image (PNG, JPG max {MESSAGE_ATTACHMENT.image.maxBytesLabel})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAttachmentSelect("video")}>
              <VideoIcon size={16} />
              Video (3GP, MP4 max {MESSAGE_ATTACHMENT.video.maxBytesLabel})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAttachmentSelect("audio")}>
              <MusicIcon size={16} />
              Audio (AAC, AMR, MP3, M4A max {MESSAGE_ATTACHMENT.audio.maxBytesLabel})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAttachmentSelect("document")}>
              <FileTextIcon size={16} />
              Document (TXT, XLS, DOC, PPT, PDF max {MESSAGE_ATTACHMENT.document.maxBytesLabel})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => setEmojiPickerOpen((open) => !open)}
          disabled={isSendingMessage}
          aria-label="Insert emoji"
        >
          <SmileIcon size={20} />
        </Button>
        <Input
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder={attachmentType === "audio" ? "Audio attached" : "Type a message..."}
          disabled={isSendingMessage || attachmentType === "audio"}
        />
        <Button type="submit" disabled={isSendingMessage || (!attachmentFile && !draftMessage.trim())}>
          {isSendingMessage ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
