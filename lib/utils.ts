import type { PropertiesWhereInput } from "@/generated/prisma/models";
import { clsx, type ClassValue } from "clsx";
import type { AuthenticatedUser } from "@/types/AuthenticatedUser";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function standardizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function limitText(text: string, limit: number = 120): string {
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

export function formatLabel(text: string): string {
  return text
    .split(/[-_ ]+/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function hasPermissions(user: AuthenticatedUser | null, ...permissions: string[]) {
  if (!user) return false;
  if (user.role === "super-admin") return true;

  return user.permissions.some((permission) => permissions.includes(permission));
}

export function propertiesWhereForUser(user: AuthenticatedUser): PropertiesWhereInput | undefined {
  if (user.role === "super-admin") {
    return undefined;
  }
  return { id: { in: user.allowedProperties } };
}

export function userCanAccessProperty(user: AuthenticatedUser, propertyId: number): boolean {
  if (user.role === "super-admin") {
    return true;
  }
  return user.allowedProperties.includes(propertyId);
}

export type PropertyIdScope = { ok: false } | { ok: true; filter: undefined | number | { in: number[] } };

export function resolvePropertyIdScope(user: AuthenticatedUser, propertyId: number | null): PropertyIdScope {
  if (user.role === "super-admin") {
    if (propertyId !== null) {
      return { ok: true, filter: propertyId };
    }
    return { ok: true, filter: undefined };
  }

  const allowed = user.allowedProperties;
  if (propertyId !== null) {
    if (!allowed.includes(propertyId)) {
      return { ok: false };
    }
    return { ok: true, filter: propertyId };
  }
  return { ok: true, filter: allowed.length === 0 ? { in: [] } : { in: allowed } };
}
