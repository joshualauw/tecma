export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  allowedProperties: number[];
}
