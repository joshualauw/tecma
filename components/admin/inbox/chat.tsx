"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { MessageStatus, MessageType, RoomStatus, SenderType } from "@/generated/prisma/enums";
import dayjs from "@/lib/dayjs";
import type { MessageExtras } from "@/types/MessageExtras";
import { Check, CheckCheck, CircleStop, FileText, ImageIcon, Loader2, MapPin, Music, Video } from "lucide-react";
import { useState } from "react";

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
    return <Loader2 size={size} className="shrink-0 animate-spin opacity-80" />;
  }
  if (status === MessageStatus.sent) {
    return <Check size={size} className="shrink-0 opacity-80" />;
  }
  if (status === MessageStatus.delivered) {
    return <CheckCheck size={size} className="shrink-0 opacity-80" />;
  }
  if (status === MessageStatus.read) {
    return <CheckCheck size={size} className="shrink-0 text-green-500" />;
  }
  if (status === MessageStatus.failed) {
    return <CircleStop size={size} className="shrink-0 text-destructive" />;
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
          <FileText size={18} className="shrink-0" />
          <span className="break-all text-sm">{label}</span>
        </a>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText size={16} />
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
        <Music size={18} className="shrink-0 opacity-80" />
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
          <Video size={16} />
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
          <MapPin size={18} className="shrink-0 opacity-80" />
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

  async function handleSendMessage(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draftMessage.trim();
    if (!content || isSendingMessage) {
      return;
    }

    const isSent = await onSendMessage(content);
    if (isSent) {
      setDraftMessage("");
    }
  }

  return (
    <div className={`flex min-h-0 flex-col ${isRoomDataOpen ? "basis-0 grow-[2]" : "flex-1"}`}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isLoadingRoomData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chat...</div>
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
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages yet.</div>
        )}
      </div>

      <Separator />

      {isRoomActive ? (
        <form className="flex items-center gap-2 p-4" onSubmit={handleSendMessage}>
          <Input
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Type a message..."
            disabled={isSendingMessage}
          />
          <Button type="submit" disabled={!draftMessage.trim() || isSendingMessage}>
            {isSendingMessage ? "Sending..." : "Send"}
          </Button>
        </form>
      ) : (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Room is {currentRoomStatus === RoomStatus.expired ? "expired" : "closed"}. Messaging is disabled.
        </div>
      )}
    </div>
  );
}
