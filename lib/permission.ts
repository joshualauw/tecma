import { User } from "next-auth";

export function hasPermissions(user?: User, ...permissions: string[]) {
  if (!user) return false;
  if (user.role === "super-admin") return true;

  return user.permissions.some((permission) => permissions.includes(permission));
}
