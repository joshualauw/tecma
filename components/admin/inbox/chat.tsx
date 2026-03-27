"use client";

import { Button } from "@/components/ui/button";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import type { MessageApiItem } from "@/app/api/messages/route";
import { MessageStatus, MessageType, SenderType } from "@/generated/prisma/enums";
import dayjs from "@/lib/dayjs";
import type { MessageExtras } from "@/types/MessageExtras";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  BanIcon,
  CheckCheckIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  MapPinIcon,
  MusicIcon,
  ReplyIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import InboxFooter from "@/components/admin/inbox/footer";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REPLY_PREVIEW_MAX_LENGTH } from "@/lib/constants";

function formatLastMessageAt(value: Date | string | null) {
  if (!value) {
    return "-";
  }
  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

function initialsFromName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase();
}

interface MessageSenderAvatarProps {
  senderType: SenderType;
  senderName: string | null;
}

function MessageSenderAvatar({ senderType, senderName }: MessageSenderAvatarProps) {
  if (senderName) {
    return (
      <Avatar size="sm" className={cn("shrink-0", senderType === SenderType.user && "border border-primary/20")}>
        <AvatarFallback
          className={
            senderType === SenderType.user
              ? "bg-secondary text-[10px] font-medium text-secondary-foreground"
              : "bg-muted text-[10px] font-medium text-muted-foreground"
          }
        >
          {initialsFromName(senderName)}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size="sm" className="shrink-0">
      <AvatarFallback className="bg-muted text-muted-foreground">
        <UserIcon className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}

interface MessageSenderProfileRowProps {
  show: boolean;
  senderName: string | null;
}

function MessageSenderProfileRow({ show, senderName }: MessageSenderProfileRowProps) {
  if (!show) return null;

  const name = senderName?.trim();
  const label = name ? <span className="max-w-48 truncate text-xs text-muted-foreground">{name}</span> : null;

  return (
    <div className="mb-1 flex w-full items-center justify-end gap-2">
      {label}
      <MessageSenderAvatar senderType={SenderType.user} senderName={senderName} />
    </div>
  );
}

function messageBubbleClasses(senderType: SenderType) {
  const classes = "w-full px-3 py-2 text-sm rounded-lg";
  if (senderType === SenderType.tenant) {
    return `${classes} rounded-bl-none bg-muted text-foreground`;
  } else {
    return `${classes} rounded-br-none bg-secondary text-secondary-foreground`;
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
    return <BanIcon size={size} className="shrink-0 text-destructive" />;
  }
  return null;
}

interface MessageBubbleProps {
  content: string;
  messageType: MessageType;
  extras: MessageExtras | null;
  senderType: SenderType;
  status: MessageStatus;
  createdAt: Date;
}

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
  const { messageType } = props;

  switch (messageType) {
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

interface ReplyReferenceProps {
  replyTo: NonNullable<MessageApiItem["replyTo"]>;
  senderType: SenderType;
  onScrollToMessage: (_messageId: number) => void;
}

function ReplyReference({ replyTo, senderType, onScrollToMessage }: ReplyReferenceProps) {
  const preview =
    replyTo.content.length > REPLY_PREVIEW_MAX_LENGTH
      ? `${replyTo.content.slice(0, REPLY_PREVIEW_MAX_LENGTH)}…`
      : replyTo.content;

  return (
    <button
      type="button"
      onClick={() => onScrollToMessage(replyTo.id)}
      className={`mb-1 flex w-full flex-col gap-0.5 rounded cursor-pointer border-l-2 ${senderType === SenderType.tenant ? "border-primary bg-muted" : "border-primary bg-secondary"} px-2 py-1.5 text-left text-xs`}
    >
      <span className="line-clamp-2 break-words text-foreground">{preview || `[${replyTo.messageType}]`}</span>
    </button>
  );
}

function AttachmentPreview() {
  const { attachmentFile, attachmentType, previewUrl, clearAttachment } = useInbox();
  if (!attachmentFile) return null;

  return (
    <div className="flex flex-col min-h-full items-center justify-center text-sm text-muted-foreground py-4 px-8">
      <div className="flex w-full items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">Preview</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={clearAttachment} aria-label="Remove attachment">
          <XIcon size={18} />
        </Button>
      </div>
      <div className="flex min-h-[120px] w-full flex-1 flex-col items-center justify-center">
        {attachmentType === "image" && previewUrl && (
          <img src={previewUrl} alt="Attachment preview" className="max-h-72 max-w-full object-contain" />
        )}
        {attachmentType === "video" && previewUrl && (
          <video src={previewUrl} controls className="max-h-72 max-w-full rounded-md">
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
  );
}

interface MessageActionsDropdownProps {
  message: MessageApiItem;
  setReplyToMessage: (_waId: string | null, _content: string) => void;
  onCopy: (_content: string) => void;
}

function MessageActionsDropdown({ message, setReplyToMessage, onCopy }: MessageActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Message actions"
        >
          <ChevronDownIcon size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center">
        <DropdownMenuItem
          onClick={() =>
            setReplyToMessage(message.waId, message.content === "" ? `[${message.messageType}]` : message.content)
          }
        >
          <ReplyIcon size={14} />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(message.content)}>
          <CopyIcon size={14} />
          Copy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessagesList() {
  const { messages, isLoadingRoomData, attachmentFile, setReplyToMessage } = useInbox();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefsMap = useRef<Map<number, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (isLoadingRoomData || messages.length === 0 || attachmentFile) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, isLoadingRoomData, attachmentFile]);

  const scrollToMessage = (messageId: number) => {
    messageRefsMap.current.get(messageId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content).then(() => {
      toast.success("Copied to clipboard");
    });
  };

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const showProfile = index === 0 || messages[index - 1].senderType !== message.senderType;

        return (
          <div
            key={message.id}
            ref={(el) => {
              if (el) messageRefsMap.current.set(message.id, el);
              else messageRefsMap.current.delete(message.id);
            }}
            className={cn("flex", message.senderType === SenderType.tenant ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "group flex max-w-md flex-col",
                message.senderType === SenderType.tenant ? "items-start" : "items-end",
              )}
            >
              <MessageSenderProfileRow
                show={showProfile && message.senderType === SenderType.user}
                senderName={message.createdBy?.name ?? null}
              />
              <div className="flex flex-row items-center gap-1">
                {message.senderType === SenderType.user && (
                  <MessageActionsDropdown message={message} onCopy={handleCopy} setReplyToMessage={setReplyToMessage} />
                )}
                <div className={messageBubbleClasses(message.senderType)}>
                  {message.replyTo && (
                    <ReplyReference
                      replyTo={message.replyTo}
                      senderType={message.senderType}
                      onScrollToMessage={scrollToMessage}
                    />
                  )}
                  {getMessageBubble({
                    content: message.content,
                    messageType: message.messageType,
                    extras: message.extras,
                    senderType: message.senderType,
                    status: message.status,
                    createdAt: message.createdAt,
                  })}
                </div>
                {message.senderType === SenderType.tenant && (
                  <MessageActionsDropdown message={message} onCopy={handleCopy} setReplyToMessage={setReplyToMessage} />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} aria-hidden />
    </div>
  );
}

export default function InboxChat() {
  const { isRoomDataOpen, isLoadingRoomData, messages, attachmentFile, permissions } = useInbox();

  return (
    <div className={`flex min-h-0 flex-col ${isRoomDataOpen ? "basis-0 grow-[2]" : "flex-1"}`}>
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isLoadingRoomData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chat...</div>
        ) : attachmentFile ? (
          <AttachmentPreview />
        ) : messages.length ? (
          <MessagesList />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages yet.</div>
        )}
      </div>
      <Separator />
      {permissions.canSend && <InboxFooter />}
    </div>
  );
}
