import type { PropertiesWhereInput } from "@/generated/prisma/models";
import type { AuthenticatedUser } from "@/types/AuthenticatedUser";
import type { AvailablePermission } from "@/lib/constants";

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.role === "super-admin";
}

export function hasPermissions(user: AuthenticatedUser, ...permissions: AvailablePermission[]) {
  if (isSuperAdmin(user)) return true;

  return user.permissions.some((permission) => permissions.includes(permission));
}

export function propertiesWhereForUser(user: AuthenticatedUser): PropertiesWhereInput | undefined {
  if (isSuperAdmin(user)) {
    return undefined;
  }
  return { id: { in: user.allowedProperties } };
}

export function userCanAccessProperty(user: AuthenticatedUser, propertyId: number): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }
  return user.allowedProperties.includes(propertyId);
}

export type PropertyIdScope = { ok: false } | { ok: true; filter: undefined | number | { in: number[] } };

export function resolvePropertyIdScope(user: AuthenticatedUser, propertyId: number | null): PropertyIdScope {
  if (isSuperAdmin(user)) {
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
