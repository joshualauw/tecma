"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { MessageStatus, MessageType, RoomStatus, SenderType } from "@/generated/prisma/enums";
import {
  getAcceptString,
  MESSAGE_ATTACHMENT,
  validateMessageAttachment,
  type MessageAttachmentType,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import type { MessageExtras } from "@/types/MessageExtras";
import {
  CheckIcon,
  CheckCheckIcon,
  CircleStopIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  MapPinIcon,
  MusicIcon,
  PaperclipIcon,
  SmileIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function formatLastMessageAt(value: Date | string | null) {
  if (!value) {
    return "-";
  }
  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

function messageBubbleClasses(senderType: SenderType) {
  const classes = "max-w-[80%] rounded-lg px-3 py-2 text-sm";
  if (senderType === SenderType.tenant) {
    return `${classes} bg-muted text-foreground`;
  } else {
    return `${classes} bg-secondary text-secondary-foreground`;
  }
}

function MessageStatusIcon({ status }: { status: MessageStatus | null }) {
  if (!status) return null;
  const size = 12;
  if (status === MessageStatus.pending) {
    return <Loader2Icon size={size} className="shrink-0 animate-spin opacity-80" />;
  }
  if (status === MessageStatus.sent) {
    return <CheckIcon size={size} className="shrink-0 opacity-80" />;
  }
  if (status === MessageStatus.delivered) {
    return <CheckCheckIcon size={size} className="shrink-0 opacity-80" />;
  }
  if (status === MessageStatus.read) {
    return <CheckCheckIcon size={size} className="shrink-0 text-green-500" />;
  }
  if (status === MessageStatus.failed) {
    return <CircleStopIcon size={size} className="shrink-0 text-destructive" />;
  }
  return null;
}

type MessageBubbleProps = {
  content: string;
  messageType?: MessageType | null;
  extras: MessageExtras | null;
  senderType: SenderType;
  status: MessageStatus | null;
  createdAt: Date | string;
};

function TextBubble({ content, senderType, status, createdAt }: MessageBubbleProps) {
  return (
    <>
      <p>{content}</p>
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function ImageBubble({ content, extras, senderType, status, createdAt }: MessageBubbleProps) {
  const url = extras?.image?.mediaUrl;
  const type = extras?.image?.type;
  return (
    <>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={content || "Image"} className="max-h-48 max-w-full object-contain" />
        </a>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon size={16} />
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
      {content && type !== "sticker" ? <p className="mt-1">{content}</p> : null}
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function DocumentBubble({ content, extras, senderType, status, createdAt }: MessageBubbleProps) {
  const url = extras?.document?.mediaUrl;
  const filename = extras?.document?.filename;
  const label = filename ?? content ?? "Document";
  return (
    <>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md py-1 hover:underline"
        >
          <FileTextIcon size={18} className="shrink-0" />
          <span className="break-all text-sm">{label}</span>
        </a>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileTextIcon size={16} />
          <span className="text-xs">{label}</span>
        </div>
      )}
      {content ? <p className="mt-1">{content}</p> : null}
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function AudioBubble({ extras, senderType, status, createdAt }: MessageBubbleProps) {
  const url = extras?.audio?.mediaUrl;
  return (
    <>
      <div className="flex items-center gap-2">
        <MusicIcon size={18} className="shrink-0 opacity-80" />
        {url ? (
          <audio controls className="max-w-full" src={url}>
            Your browser does not support audio.
          </audio>
        ) : (
          <span className="text-xs text-muted-foreground">Audio unavailable</span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function VideoBubble({ content, extras, senderType, status, createdAt }: MessageBubbleProps) {
  const url = extras?.video?.mediaUrl;
  return (
    <>
      {url ? (
        <div className="space-y-1">
          <video controls className="max-h-48 max-w-full rounded-md" src={url}>
            Your browser does not support video.
          </video>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <VideoIcon size={16} />
          <span className="text-xs">Video unavailable</span>
        </div>
      )}
      {content ? <p className="mt-1">{content}</p> : null}
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function LocationBubble({ extras, senderType, status, createdAt }: MessageBubbleProps) {
  const loc = extras?.location;
  const lat = loc?.latitude;
  const lng = loc?.longitude;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const name = loc?.name?.trim();
  const address = loc?.address?.trim();
  const hasNameOrAddress = !!name || !!address;
  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <MapPinIcon size={18} className="shrink-0 opacity-80" />
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
              View on map
            </a>
          ) : !hasNameOrAddress ? (
            <span className="text-xs text-muted-foreground">Location unavailable</span>
          ) : null}
        </div>
        {hasNameOrAddress && (
          <div className="flex flex-col gap-0.5 text-sm mb-1">
            {name && <span className="font-medium">{name}</span>}
            {address && <span className="text-muted-foreground">{address}</span>}
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <span className="text-[10px] opacity-80">{formatLastMessageAt(createdAt)}</span>
        {senderType !== SenderType.tenant && <MessageStatusIcon status={status} />}
      </div>
    </>
  );
}

function getMessageBubble(props: MessageBubbleProps): React.ReactNode {
  const { messageType, extras } = props;
  const effectiveType: MessageType =
    messageType ??
    (extras?.image
      ? MessageType.image
      : extras?.document
        ? MessageType.document
        : extras?.audio
          ? MessageType.audio
          : extras?.video
            ? MessageType.video
            : extras?.location
              ? MessageType.location
              : MessageType.text);

  switch (effectiveType) {
    case MessageType.image:
      return <ImageBubble {...props} />;
    case MessageType.document:
      return <DocumentBubble {...props} />;
    case MessageType.audio:
      return <AudioBubble {...props} />;
    case MessageType.video:
      return <VideoBubble {...props} />;
    case MessageType.location:
      return <LocationBubble {...props} />;
    case MessageType.text:
    default:
      return <TextBubble {...props} />;
  }
}

const ATTACHMENT_TYPE_TO_MESSAGE_TYPE: Record<MessageAttachmentType, MessageType> = {
  image: MessageType.image,
  video: MessageType.video,
  audio: MessageType.audio,
  document: MessageType.document,
};

export default function InboxChat() {
  const {
    isRoomDataOpen,
    isLoadingRoomData,
    messages,
    isRoomActive,
    currentRoomStatus,
    isSendingMessage,
    onSendMessage,
  } = useInbox();

  const [draftMessage, setDraftMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<MessageAttachmentType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (isLoadingRoomData || messages.length === 0 || attachmentFile) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, isLoadingRoomData, attachmentFile]);

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

      const result = validateMessageAttachment({ type: file.type, size: file.size, name: file.name }, type);
      if (!result.valid) {
        toast.error(result.error);
        event.target.value = "";
        return;
      }

      setAttachmentFile(file);
      setAttachmentType(type);
      if (type === "audio") {
        setDraftMessage("");
      }
      event.target.value = "";
    },
    [],
  );

  const clearAttachment = useCallback(() => {
    setAttachmentFile(null);
    setAttachmentType(null);
  }, []);

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

  async function handleSendMessage(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSendingMessage) return;

    const content = draftMessage.trim();

    if (attachmentFile && attachmentType) {
      const messageType = ATTACHMENT_TYPE_TO_MESSAGE_TYPE[attachmentType];
      const isSent = await onSendMessage(content, messageType, attachmentFile);
      if (isSent) {
        setDraftMessage("");
        clearAttachment();
      }
    } else {
      const isSent = await onSendMessage(content, MessageType.text);
      if (isSent) {
        setDraftMessage("");
      }
    }
  }

  return (
    <div className={`flex min-h-0 flex-col ${isRoomDataOpen ? "basis-0 grow-[2]" : "flex-1"}`}>
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isLoadingRoomData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chat...</div>
        ) : attachmentFile ? (
          <div className="flex flex-col min-h-full items-center justify-center text-sm text-muted-foreground py-4 px-8">
            <div className="flex w-full items-center justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Preview</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearAttachment}
                aria-label="Remove attachment"
              >
                <XIcon size={18} />
              </Button>
            </div>
            <div className="flex min-h-[120px] w-full flex-1 flex-col items-center justify-center rounded-lg border bg-muted/50 p-4">
              {attachmentType === "image" && previewUrl && (
                <Image
                  src={previewUrl}
                  width={100}
                  height={100}
                  alt="Attachment preview"
                  className="max-h-64 max-w-full object-contain"
                />
              )}
              {attachmentType === "video" && previewUrl && (
                <video src={previewUrl} controls className="max-h-64 max-w-full rounded-md">
                  Your browser does not support video.
                </video>
              )}
              {(attachmentType === "document" || attachmentType === "audio") && (
                <div className="flex flex-col items-center gap-2">
                  {attachmentType === "audio" ? (
                    <MusicIcon size={48} className="text-muted-foreground" />
                  ) : (
                    <FileTextIcon size={48} className="text-muted-foreground" />
                  )}
                  <span className="max-w-full truncate text-center text-sm">{attachmentFile.name}</span>
                </div>
              )}
            </div>
          </div>
        ) : messages.length ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === SenderType.tenant ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`${messageBubbleClasses(message.senderType)} ${message.status === MessageStatus.pending ? "opacity-70" : ""}`}
                >
                  {getMessageBubble({
                    content: message.content,
                    messageType: message.messageType,
                    extras: message.extras,
                    senderType: message.senderType,
                    status: message.status,
                    createdAt: message.createdAt,
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} aria-hidden />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages yet.</div>
        )}
      </div>

      <Separator />

      {isRoomActive ? (
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

          <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
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
      ) : (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Room is {currentRoomStatus === RoomStatus.expired ? "expired" : "closed"}. Messaging is disabled.
        </div>
      )}
    </div>
  );
}
