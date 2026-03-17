"use client";

import { AuthenticatedUser } from "@/types/AuthenticatedUser";
import { useState } from "react";

export interface UseAuthStateProps {
  user: AuthenticatedUser;
}

export function useAuthState({ user: initialUser }: UseAuthStateProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(initialUser);

  return {
    user,
    setUser,
  };
}
