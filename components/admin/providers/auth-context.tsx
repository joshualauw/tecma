"use client";

import { createContext, useContext } from "react";
import { AuthenticatedUser } from "@/types/AuthenticatedUser";
import { useAuthState } from "@/components/admin/providers/use-auth-state";

export type AuthContextValue = AuthenticatedUser;

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  user: AuthenticatedUser;
}

export function AuthProvider({ children, user }: AuthProviderProps) {
  const value = useAuthState({ user });
  return <AuthContext.Provider value={value.user}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
