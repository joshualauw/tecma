"use client";

import Logo from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  BotIcon,
  ChevronsUpDownIcon,
  Contact2Icon,
  ExternalLinkIcon,
  HouseHeartIcon,
  MailOpenIcon,
  MapPinIcon,
  PhoneIcon,
  PieChartIcon,
  SettingsIcon,
  TicketIcon,
  Users2Icon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

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

  const properties = useMemo(
    () => [
      {
        id: "oakridge",
        name: "Oakridge Residency",
      },
      {
        id: "sunset",
        name: "Sunset Towers",
      },
      {
        id: "maple",
        name: "Maple Court",
      },
    ],
    [],
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId) ?? properties[0];

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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="md">
                  <MapPinIcon className="mr-1.5" />
                  <span>{selectedProperty?.name ?? "Select property"}</span>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuRadioGroup value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  {properties.map((property) => (
                    <DropdownMenuRadioItem key={property.id} value={property.id}>
                      {property.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <SettingsIcon className="mr-1" /> Manage Properties
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
