"use client";

import { Bell, LogOut, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DynamicBreadcrumb } from "@/components/admin/breadcrumb";
import { signOut } from "next-auth/react";
import { useAuth } from "@/components/admin/providers/auth-context";
import { formatLabel } from "@/lib/utils";
import { getPusherClient } from "@/lib/integrations/pusher-client";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/swr/notifications/use-notifications";
import dayjs from "@/lib/integrations/dayjs";
import type { NotificationApiItem } from "@/app/api/notifications/route";
import { useRouter } from "next/navigation";
import { NOTIFICATIONS_PAGE_SIZE } from "@/lib/constants";

export function AdminHeader() {
  const user = useAuth();
  const { data, isLoading, mutate } = useNotifications({ pageIndex: 0, pageSize: 10 });
  const notifications = data?.notifications.slice(0, NOTIFICATIONS_PAGE_SIZE) ?? [];
  const router = useRouter();

  const [openNotifications, setOpenNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function handleSignOut() {
    await signOut({ redirectTo: "/" });
  }

  function handleNotification(incoming: NotificationApiItem) {
    setUnreadCount((prev) => prev + 1);

    void mutate(
      (current) => {
        if (!current) {
          return {
            notifications: [incoming],
            count: 1,
          };
        }
        return {
          ...current,
          notifications: [incoming, ...current.notifications],
          count: current.count + 1,
        };
      },
      { revalidate: false },
    );
  }

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `notifications.user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-notification", handleNotification);

    return () => {
      channel.unbind("new-notification", handleNotification);
      pusher.unsubscribe(channelName);
    };
  }, [user.id, handleNotification]);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border mx-2 hidden md:block" />
        <DynamicBreadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <Popover
          open={openNotifications}
          onOpenChange={(nextOpen) => {
            setOpenNotifications(nextOpen);
            if (nextOpen) setUnreadCount(0);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-primary transition-colors"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="min-w-0 py-1">
                <p className="font-semibold text-foreground leading-none">Notifications</p>
              </div>
              {unreadCount > 0 && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="border-t" />

            <div className="text-sm max-h-60 overflow-y-auto">
              {notifications.length === 0 && !isLoading ? (
                <div className="px-3 py-8">
                  <p className="text-xs text-center text-muted-foreground">No notifications yet.</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => {
                    return (
                      <div
                        key={n.id}
                        className="group flex gap-2 px-3 py-2.5 transition-colors hover:bg-accent/40 border-b"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground leading-snug truncate">{n.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-none truncate">
                            by {n.createdBy?.name ?? "Unknown"} at {dayjs(n.createdAt).format("DD/MM/YYYY HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t" />
            <div className="p-1.5">
              <Button
                variant="ghost"
                className="h-8 w-full justify-center font-normal text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/admin/notifications")}
              >
                See all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border mx-1" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 p-2 hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatLabel(user.role)}</span>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={""} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                    {user.name.split(" ")[1]?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-44" align="end" forceMount>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  await handleSignOut();
                }}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
