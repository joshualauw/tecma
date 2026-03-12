"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { RoomStatus, SenderType } from "@/generated/prisma/enums";
import dayjs from "@/lib/dayjs";
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
                <div className={messageBubbleClasses(message.senderType)}>
                  <p>{message.content}</p>
                  <p className="mt-1 text-[10px] opacity-80">{formatLastMessageAt(message.createdAt)}</p>
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
