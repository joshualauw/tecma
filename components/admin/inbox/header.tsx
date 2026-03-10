"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useInbox } from "@/components/admin/inbox/providers/inbox-context";
import dayjs from "@/lib/dayjs";
import { AlertTriangleIcon, PanelRightOpenIcon } from "lucide-react";

function formatExpiresIn(value: Date | string) {
  const diff = dayjs(value).diff(dayjs());

  if (diff <= 0) {
    return "Expired";
  }

  const d = dayjs.duration(diff);
  const days = d.days();
  const hours = d.hours();
  const minutes = d.minutes();

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function InboxHeader() {
  const {
    tenantName,
    expiredAt,
    setIsRoomDataOpen,
    isResolveDialogOpen,
    setIsResolveDialogOpen,
    onConfirmResolveRoom,
    isResolvingRoom,
    isRoomActive,
    hasRoomDetail,
    openTicketsCount,
  } = useInbox();

  const onToggleRoomData = () => setIsRoomDataOpen((prev) => !prev);

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div onClick={onToggleRoomData} className="cursor-pointer">
          <p className="text-sm font-semibold">{tenantName}</p>
          <p className="text-xs text-muted-foreground">Expires in: {formatExpiresIn(expiredAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsResolveDialogOpen(true)}
            disabled={!hasRoomDetail || !isRoomActive || isResolvingRoom}
          >
            Resolve
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Open room data"
            onClick={onToggleRoomData}
            disabled={!hasRoomDetail}
          >
            <PanelRightOpenIcon />
          </Button>
        </div>
      </div>

      <AlertDialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve this room?</AlertDialogTitle>
            <AlertDialogDescription>This will close the room and end the conversation</AlertDialogDescription>
          </AlertDialogHeader>

          {openTicketsCount > 0 && (
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>Open tickets still exist</AlertTitle>
              <AlertDescription>
                {openTicketsCount} {openTicketsCount === 1 ? "ticket is" : "tickets are"} still open.
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResolvingRoom}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmResolveRoom} disabled={isResolvingRoom}>
              {isResolvingRoom ? "Resolving..." : "Resolve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
