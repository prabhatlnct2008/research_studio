"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, ListChecks, Search, Shield, Users } from "lucide-react";
import { useShell } from "./shell-context";
import { Tree } from "./tree";
import { ForYou } from "./for-you";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/actions/auth";

export function Rail({ onNavigate }: { onNavigate?: () => void }) {
  const { tree, me, nav } = useShell();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out: { label: string; sub: string; href: string }[] = [];
    for (const c of tree) {
      if (c.name.toLowerCase().includes(q))
        out.push({ label: c.name, sub: "Client", href: `/clients/${c.id}` });
      for (const s of c.studies) {
        if (s.name.toLowerCase().includes(q))
          out.push({ label: s.name, sub: c.name, href: `/studies/${s.id}` });
      }
    }
    return out.slice(0, 12);
  }, [query, tree]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2">
          <LogoMark className="h-6 w-6 text-accent" />
          <span className="text-card-title font-bold text-ink">Studio</span>
        </Link>
      </div>

      <div className="shrink-0 px-3 py-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the tree…"
            className="input pl-9 py-1.5 text-meta"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        {matches ? (
          <div className="px-2">
            <p className="eyebrow px-2 py-2">Results</p>
            {matches.length === 0 && (
              <p className="px-2 py-2 text-meta text-muted">No matches.</p>
            )}
            {matches.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => {
                  setQuery("");
                  onNavigate?.();
                }}
                className="block rounded-[10px] px-2 py-2 hover:bg-surface-2"
              >
                <span className="block truncate text-body text-ink">{m.label}</span>
                <span className="block truncate text-meta text-muted">{m.sub}</span>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <ForYou onNavigate={onNavigate} />
            <Tree onNavigate={onNavigate} />
            <AdminNav onNavigate={onNavigate} />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={me.name} isMe />
          <div className="min-w-0 flex-1">
            <p className="truncate text-meta font-medium text-ink">{me.name}</p>
            <p className="truncate text-[11px] text-muted">{me.roleName ?? "No role"}</p>
          </div>
          <form action={signOutAction}>
            <button className="btn-ghost px-2" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { nav } = useShell();
  if (!nav.manageUsers && !nav.createRoles && !nav.createGates) return null;
  return (
    <div className="mt-2 px-3 pt-3">
      <p className="eyebrow px-1 pb-2">Admin</p>
      {nav.manageUsers && (
        <Link
          href="/admin/users"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-body text-ink hover:bg-surface-2"
        >
          <Users size={16} className="text-muted" /> Users
        </Link>
      )}
      {nav.createRoles && (
        <Link
          href="/admin/roles"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-body text-ink hover:bg-surface-2"
        >
          <Shield size={16} className="text-muted" /> Roles
        </Link>
      )}
      {nav.createGates && (
        <Link
          href="/admin/gates"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-body text-ink hover:bg-surface-2"
        >
          <ListChecks size={16} className="text-muted" /> Gate templates
        </Link>
      )}
    </div>
  );
}
