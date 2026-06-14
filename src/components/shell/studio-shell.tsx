"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { ClientNode } from "@/lib/data";
import type { Pending } from "@/lib/pending";
import { ShellProvider, type Me, type NavCaps } from "./shell-context";
import { Rail } from "./rail";
import { Breadcrumb } from "./breadcrumb";

export function StudioShell({
  tree,
  pending,
  me,
  nav,
  children,
}: {
  tree: ClientNode[];
  pending: Pending;
  me: Me;
  nav: NavCaps;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);

  return (
    <ShellProvider value={{ tree, pending, me, nav }}>
      <div className="flex h-screen overflow-hidden">
        {/* Left rail — the product's identity. Fixed 300px; drawer < 780px. */}
        <aside
          className={[
            "z-30 w-[300px] shrink-0 border-r border-border bg-surface md:static md:translate-x-0",
            "fixed inset-y-0 left-0 transition-transform duration-200",
            drawer ? "translate-x-0 shadow-overlay" : "-translate-x-full",
          ].join(" ")}
        >
          <Rail onNavigate={() => setDrawer(false)} />
        </aside>

        {drawer && (
          <div
            className="fixed inset-0 z-20 bg-ink/20 md:hidden"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-4">
            <button
              className="btn-ghost -ml-2 px-2 md:hidden"
              onClick={() => setDrawer((v) => !v)}
              aria-label="Toggle navigation"
            >
              {drawer ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Breadcrumb />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[920px] px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
