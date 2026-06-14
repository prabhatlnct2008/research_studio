"use client";

import { createContext, useContext } from "react";
import type { ClientNode } from "@/lib/data";
import type { Pending } from "@/lib/pending";

export type Me = {
  id: string;
  name: string;
  email: string;
  roleName: string | null;
};

export type NavCaps = {
  manageUsers: boolean;
  createRoles: boolean;
  createGates: boolean;
  createClients: boolean;
  createStudies: boolean;
};

type ShellData = {
  tree: ClientNode[];
  pending: Pending;
  me: Me;
  nav: NavCaps;
};

const ShellContext = createContext<ShellData | null>(null);

export function ShellProvider({
  value,
  children,
}: {
  value: ShellData;
  children: React.ReactNode;
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellData {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}
