"use client";

import Logo from "@/components/logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ChevronRightIcon,
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
      icon: <PieChartIcon className="mr-1" />,
      href: "/admin/dashboard",
      isActive: false,
    },
    {
      name: "Inbox",
      group: "Communication",
      icon: <MailOpenIcon className="mr-1" />,
      href: "/admin/inbox",
      isActive: false,
    },
    {
      name: "Whatsapp",
      group: "Communication",
      icon: <PhoneIcon className="mr-1" />,
      href: "/admin/whatsapp",
      isActive: false,
    },
    {
      name: "Tickets",
      group: "Communication",
      icon: <TicketIcon className="mr-1" />,
      href: "#",
      isActive: false,
      children: [
        {
          name: "List",
          href: "/admin/tickets",
        },
        {
          name: "Categories",
          href: "/admin/tickets/categories",
        },
      ],
    },
    {
      name: "Properties",
      group: "Management",
      icon: <MapPinIcon className="mr-1" />,
      href: "/admin/properties",
      isActive: false,
    },
    {
      name: "Units",
      group: "Management",
      icon: <HouseHeartIcon className="mr-1" />,
      href: "/admin/units",
      isActive: false,
    },
    {
      name: "Tenants",
      group: "Management",
      icon: <Contact2Icon className="mr-1" />,
      href: "/admin/tenants",
      isActive: false,
    },
    {
      name: "Employees",
      group: "Management",
      icon: <Users2Icon className="mr-1" />,
      href: "/admin/employees",
      isActive: false,
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
            Tenant Complaint Management
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
                    <Collapsible key={nav.name} asChild defaultOpen={nav.isActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton asChild size="md" isActive={isActive}>
                            <Link href={nav.href} className="cursor-default">
                              {nav.icon}
                              {nav.name}
                              {nav.children && (
                                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        {nav.children && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {nav.children.map((child) => {
                                const isChildActive = pathName === child.href;
                                return (
                                  <SidebarMenuSubItem key={child.name}>
                                    <SidebarMenuSubButton asChild size="sm" isActive={isChildActive}>
                                      <Link href={child.href} className="cursor-default">
                                        {child.name}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
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
