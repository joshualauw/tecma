"use client";

import Logo from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Properties } from "@/generated/prisma/client";
import {
  BotIcon,
  Contact2Icon,
  HouseHeartIcon,
  MailOpenIcon,
  MapPinIcon,
  PhoneIcon,
  PieChartIcon,
  TicketIcon,
  Users2Icon,
} from "lucide-react";
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
      group: "Customer Service",
      icon: <MailOpenIcon className="mr-1.5" />,
      href: "/admin/inbox",
    },
    {
      name: "Tickets",
      group: "Customer Service",
      icon: <TicketIcon className="mr-1.5" />,
      href: "/admin/tickets",
    },
    {
      name: "Whatsapp",
      group: "Customer Service",
      icon: <PhoneIcon className="mr-1.5" />,
      href: "/admin/whatsapp",
    },
    {
      name: "Chatbot",
      group: "Customer Service",
      icon: <BotIcon className="mr-1.5" />,
      href: "/admin/chatbot",
    },
    {
      name: "Properties",
      group: "Management",
      icon: <MapPinIcon className="mr-1.5" />,
      href: "/admin/properties",
    },
    {
      name: "Units",
      group: "Management",
      icon: <HouseHeartIcon className="mr-1.5" />,
      href: "/admin/units",
    },
    {
      name: "Tenants",
      group: "Management",
      icon: <Contact2Icon className="mr-1.5" />,
      href: "/admin/tenants",
    },
    {
      name: "Employees",
      group: "Management",
      icon: <Users2Icon className="mr-1.5" />,
      href: "/admin/employees",
    },
  ];

  const groupedNavs = navs.reduce(
    (acc, nav) => {
      const group = nav.group || "General";
      if (!acc[group]) acc[group] = [];
      acc[group].push(nav);
      return acc;
    },
    {} as Record<string, typeof navs>,
  );

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
        {Object.entries(groupedNavs).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="-mb-3">
            <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((nav) => {
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
