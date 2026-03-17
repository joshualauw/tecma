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

export function AdminHeader() {
  const user = useAuth();

  async function handleSignOut() {
    await signOut({ redirectTo: "/" });
  }

  function getUserRole(role: string) {
    switch (role) {
      case "super-admin":
        return "Super Admin";
      case "dispatcher":
        return "Dispatcher";
      case "worker":
        return "Worker";
    }
    return "Unknown";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border mx-2 hidden md:block" />
        <DynamicBreadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 p-2 hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{getUserRole(user.role)}</span>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={""} alt={user.name ?? ""} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user.name?.charAt(0).toUpperCase()}
                    {user.name?.split(" ")[1]?.charAt(0).toUpperCase()}
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
