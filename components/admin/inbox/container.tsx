"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import InboxChat from "@/components/admin/inbox/chat";
import InboxHeader from "@/components/admin/inbox/header";
import InboxInfo from "@/components/admin/inbox/info";
import InboxRooms from "@/components/admin/inbox/rooms";
import { InboxProvider, useInbox } from "@/components/admin/inbox/providers/inbox-context";
import { getPusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { RoomStatus } from "@/generated/prisma/enums";

interface InboxContainerProps {
  properties: {
    id: number;
    name: string;
  }[];
}

export default function InboxContainer({ properties }: InboxContainerProps) {
  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-0">
        <InboxProvider properties={properties}>
          <InboxPusherSubscription />
          <div className="grid h-[calc(100vh-6rem)] min-h-[520px] md:grid-cols-[320px_1fr]">
            <InboxRooms />
            <div className="flex min-h-0 flex-col">
              <InboxRightColumn />
            </div>
          </div>
        </InboxProvider>
      </CardContent>
    </Card>
  );
}

function InboxPusherSubscription() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;

  const { updateRoomList, appendNewRoom, appendNewMessage, updateMessageStatus, selectedRoom } = useInbox();

  useEffect(() => {
    if (userId == null) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `user-${userId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("update-room", updateRoomList);
    channel.bind("new-room", appendNewRoom);

    return () => {
      channel.unbind("update-room", updateRoomList);
      channel.unbind("new-room", appendNewRoom);
      pusher.unsubscribe(channelName);
    };
  }, [userId, updateRoomList, appendNewRoom]);

  useEffect(() => {
    if (selectedRoom == null || selectedRoom.status !== RoomStatus.active) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `room-${selectedRoom.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-message", appendNewMessage);
    channel.bind("new-message-status", updateMessageStatus);

    return () => {
      channel.unbind("new-message", appendNewMessage);
      channel.unbind("new-message-status", updateMessageStatus);
      pusher.unsubscribe(channelName);
    };
  }, [selectedRoom, appendNewMessage, updateMessageStatus]);

  return null;
}

function InboxRightColumn() {
  const { selectedRoomId, isRoomDataOpen } = useInbox();

  if (selectedRoomId === null) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Select a room to view chat messages.</p>
      </div>
    );
  }

  return (
    <>
      <InboxHeader />
      <Separator />
      <div className="min-h-0 flex flex-1">
        <InboxChat />
        {isRoomDataOpen && (
          <div className="min-h-0 basis-0 grow border-l">
            <InboxInfo />
          </div>
        )}
      </div>
    </>
  );
}
