"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useShell } from "./shell-context";

export function ForYou({ onNavigate }: { onNavigate?: () => void }) {
  const { pending } = useShell();

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="eyebrow">For you</p>
        {pending.items.length > 0 && <span className="count-badge">{pending.items.length}</span>}
      </div>

      {pending.items.length === 0 ? (
        <p className="rounded-[10px] bg-surface-2 px-3 py-2.5 text-meta text-muted">
          Nothing waiting on you.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {pending.items.slice(0, 8).map((it) => (
            <li key={it.id}>
              <Link
                href={it.link}
                onClick={onNavigate}
                className="flex items-start gap-2 rounded-[10px] px-2 py-2 hover:bg-surface-2"
              >
                <Clock size={15} className="mt-0.5 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-meta font-medium text-ink">{it.label}</span>
                    <span
                      className={[
                        "shrink-0 text-[11px] tnum",
                        it.overdue ? "text-red" : "text-muted",
                      ].join(" ")}
                    >
                      {it.hint}
                    </span>
                  </span>
                  <span className="block truncate text-[11px] text-muted">{it.sublabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
