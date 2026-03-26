import { AvailablePermission } from "@/lib/constants";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: AvailablePermission[];
  allowedProperties: number[];
}
