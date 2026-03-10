"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import InboxChat from "@/components/admin/inbox/chat";
import InboxHeader from "@/components/admin/inbox/header";
import InboxInfo from "@/components/admin/inbox/info";
import InboxRooms from "@/components/admin/inbox/rooms";
import { InboxProvider, useInbox } from "@/components/admin/inbox/providers/inbox-context";

interface InboxContainerProps {
  properties: {
    id: number;
    name: string;
  }[];
}

export default function InboxContainer({ properties }: InboxContainerProps) {
  return (
    <Card className="overflow-hidden rounded-sm p-0">
      <CardContent className="p-0">
        <InboxProvider properties={properties}>
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
