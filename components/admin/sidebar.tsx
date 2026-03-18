"use client";

import Logo from "@/components/logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { hasPermissions } from "@/lib/utils";
import {
  ChevronRightIcon,
  Contact2Icon,
  HouseHeartIcon,
  LockKeyholeIcon,
  MailOpenIcon,
  MapPinIcon,
  PhoneIcon,
  PieChartIcon,
  TicketIcon,
  Users2Icon,
} from "lucide-react";
import { useAuth } from "@/components/admin/providers/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathName = usePathname();
  const user = useAuth();

  const allNavs = [
    {
      name: "Dashboard",
      isShow: true,
      icon: <PieChartIcon className="mr-1" />,
      href: "/admin/dashboard",
      isActive: false,
    },
    {
      name: "Inbox",
      isShow: hasPermissions(user, "inbox:view"),
      icon: <MailOpenIcon className="mr-1" />,
      href: "/admin/inbox",
      isActive: false,
    },
    {
      name: "Tickets",
      isShow: hasPermissions(user, "tickets:view"),
      icon: <TicketIcon className="mr-1" />,
      href: "#",
      isActive: false,
      children: [
        { name: "List", href: "/admin/tickets" },
        { name: "Categories", href: "/admin/tickets/categories" },
      ],
    },
    {
      name: "Properties",
      isShow: user.role === "super-admin",
      icon: <MapPinIcon className="mr-1" />,
      href: "/admin/properties",
      isActive: false,
    },
    {
      name: "Units",
      isShow: hasPermissions(user, "units:view"),
      icon: <HouseHeartIcon className="mr-1" />,
      href: "/admin/units",
      isActive: false,
    },
    {
      name: "Tenants",
      isShow: hasPermissions(user, "tenants:view"),
      icon: <Contact2Icon className="mr-1" />,
      href: "/admin/tenants",
      isActive: false,
    },
    {
      name: "Whatsapp",
      isShow: user.role === "super-admin",
      icon: <PhoneIcon className="mr-1" />,
      href: "/admin/whatsapp",
      isActive: false,
    },
    {
      name: "Employees",
      isShow: user.role === "super-admin",
      icon: <Users2Icon className="mr-1" />,
      href: "/admin/employees",
      isActive: false,
    },
    {
      name: "Roles",
      isShow: user.role === "super-admin",
      icon: <LockKeyholeIcon className="mr-1" />,
      href: "/admin/roles",
      isActive: false,
    },
  ];

  const navs = allNavs.filter((nav) => nav.isShow);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 pt-4 mb-2">
          <Logo />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Tenant Complaint Management
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navs.map((nav) => {
            const isActive = pathName === nav.href || pathName.startsWith(`${nav.href}/`);
            return (
              <Collapsible key={nav.name} asChild defaultOpen={nav.isActive} className="group/collapsible">
                <SidebarMenuItem className="mx-2 my-0.5">
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
      </SidebarContent>
    </Sidebar>
  );
}
