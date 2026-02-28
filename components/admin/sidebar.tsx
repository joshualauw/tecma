"use client";

import Logo from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BotIcon, Contact2Icon, LinkIcon, MailOpenIcon, PieChartIcon, TicketIcon, Users2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathName = usePathname();

  const navs = [
    {
      name: "Dashboard",
      icon: <PieChartIcon className="mr-1.5" />,
      href: "/admin/dashboard",
    },
    {
      name: "Inbox",
      icon: <MailOpenIcon className="mr-1.5" />,
      href: "/admin/inbox",
    },
    {
      name: "Contacts",
      icon: <Contact2Icon className="mr-1.5" />,
      href: "/admin/contacts",
    },
    {
      name: "Employee",
      icon: <Users2Icon className="mr-1.5" />,
      href: "/admin/employee",
    },
    {
      name: "Tickets",
      icon: <TicketIcon className="mr-1.5" />,
      href: "/admin/tickets",
    },
    {
      name: "Chatbot",
      icon: <BotIcon className="mr-1.5" />,
      href: "/admin/chatbot",
    },
    {
      name: "Integrations",
      icon: <LinkIcon className="mr-1.5" />,
      href: "/admin/integrations",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 pt-4">
          <Logo />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Tenant Complain Management
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navs.map((nav) => {
                const isActive = pathName === nav.href || pathName.startsWith(`${nav.href}/`);
                return (
                  <Link key={nav.name} href={nav.href} passHref>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="md" isActive={isActive}>
                        {nav.icon}
                        {nav.name}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
