"use client";

import { createContext, useContext } from "react";
import { useInboxState } from "@/components/admin/inbox/providers/use-inbox-state";

export type InboxContextValue = ReturnType<typeof useInboxState>;

const InboxContext = createContext<InboxContextValue | null>(null);

export interface InboxProviderProps {
  children: React.ReactNode;
  properties: {
    id: number;
    name: string;
  }[];
}

export function InboxProvider({ children, properties }: InboxProviderProps) {
  const value = useInboxState({ properties });
  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const context = useContext(InboxContext);
  if (context === null) {
    throw new Error("useInbox must be used within InboxProvider");
  }
  return context;
}
