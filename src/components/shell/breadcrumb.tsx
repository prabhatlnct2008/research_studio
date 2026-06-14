"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { useShell } from "./shell-context";
import { STAGES } from "@/lib/constants";

type Crumb = { label: string; href: string };

export function Breadcrumb() {
  const { tree, pending } = useShell();
  const pathname = usePathname();
  const [bellOpen, setBellOpen] = useState(false);

  const crumbs: Crumb[] = [{ label: "Workspace", href: "/" }];
  const parts = pathname.split("/").filter(Boolean);

  const findStudy = (id: string) => {
    for (const c of tree) {
      const s = c.studies.find((st) => st.id === id);
      if (s) return { study: s, client: c };
    }
    return null;
  };

  if (parts[0] === "clients" && parts[1]) {
    const c = tree.find((x) => x.id === parts[1]);
    if (c) crumbs.push({ label: c.name, href: `/clients/${c.id}` });
  } else if (parts[0] === "studies" && parts[1]) {
    const found = findStudy(parts[1]);
    if (found) {
      crumbs.push({ label: found.client.name, href: `/clients/${found.client.id}` });
      crumbs.push({ label: found.study.name, href: `/studies/${found.study.id}` });
      if (parts[2] === "stages" && parts[3] != null) {
        const idx = Number(parts[3]);
        crumbs.push({ label: STAGES[idx] ?? `Stage ${idx}`, href: `/studies/${found.study.id}/stages/${idx}` });
        const section = parts[4];
        if (section) {
          const label = section.charAt(0).toUpperCase() + section.slice(1);
          crumbs.push({ label, href: `/studies/${found.study.id}/stages/${idx}/${section}` });
        }
      }
    }
  } else if (parts[0] === "admin") {
    const adminLabel = parts[1] === "roles" ? "Roles" : parts[1] === "gates" ? "Gate templates" : "Users";
    crumbs.push({ label: adminLabel, href: pathname });
  } else if (parts[0] === "change-password") {
    crumbs.push({ label: "Change password", href: pathname });
  }

  return (
    <div className="flex w-full items-center justify-between">
      <nav className="flex min-w-0 items-center gap-1.5 text-meta" aria-label="Breadcrumb">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.href}-${i}`}>
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-faint" />}
              {last ? (
                <span className="truncate font-semibold text-ink">{c.label}</span>
              ) : (
                <Link href={c.href} className="truncate text-muted hover:text-ink">
                  {c.label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="relative shrink-0">
        <button
          onClick={() => setBellOpen((v) => !v)}
          className="btn-ghost relative px-2"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {pending.bell > 0 && (
            <span className="absolute -right-1 -top-1 count-badge h-4 min-w-4 text-[10px]">
              {pending.bell}
            </span>
          )}
        </button>
        {bellOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} aria-hidden />
            <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-card border border-border bg-surface shadow-overlay">
              <div className="border-b border-border px-4 py-2.5">
                <p className="eyebrow">For you</p>
              </div>
              <div className="max-h-96 overflow-y-auto py-1">
                {pending.items.length === 0 ? (
                  <p className="px-4 py-4 text-meta text-muted">Nothing waiting on you.</p>
                ) : (
                  pending.items.map((it) => (
                    <Link
                      key={it.id}
                      href={it.link}
                      onClick={() => setBellOpen(false)}
                      className="block px-4 py-2.5 hover:bg-surface-2"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-meta font-medium text-ink">{it.label}</span>
                        <span className={["shrink-0 text-[11px] tnum", it.overdue ? "text-red" : "text-muted"].join(" ")}>
                          {it.hint}
                        </span>
                      </span>
                      <span className="block truncate text-[11px] text-muted">{it.sublabel}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
