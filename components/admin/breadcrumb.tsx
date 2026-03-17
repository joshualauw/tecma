"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import Link from "next/link";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment !== "" && segment !== "admin");

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const href = `/admin/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;

          const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
          const NON_CLICKABLE_SEGMENTS = ["update", "edit", "view", "lease", "permission"];
          const isClickable = !NON_CLICKABLE_SEGMENTS.includes(segment) && !isLast;

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {!isClickable ? (
                  <BreadcrumbPage className="font-semibold text-foreground">{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="capitalize">
                    <Link href={href}>{title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
