"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  fromAddr: string;
  toAddr: string;
  subject: string | null;
  body: string | null;
  occurredAt: number;
  status: string;
};

export function EmailThread({ subject, messages }: { subject: string; messages: Message[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-surface-2"
      >
        <ChevronRight size={15} className={`shrink-0 text-faint transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{subject || "(no subject)"}</span>
        <span className="count-badge">{messages.length}</span>
      </button>
      {open && (
        <div className="divide-y divide-border border-t border-border">
          {messages.map((m) => (
            <div key={m.id} className="px-4 py-3">
              <div className="mb-1 flex items-center justify-between gap-2 text-meta">
                <span className="min-w-0 truncate text-ink">
                  <span className={`pill mr-2 ${m.direction === "outbound" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>
                    {m.direction === "outbound" ? "Sent" : "Received"}
                  </span>
                  {m.fromAddr} → {m.toAddr}
                </span>
                <span className="tnum shrink-0 text-muted">{fmtDateTime(m.occurredAt)}</span>
              </div>
              {m.status === "failed" && <p className="mb-1 text-[11px] text-red">Send failed</p>}
              <p className="whitespace-pre-wrap text-meta text-muted">{m.body || "(no body)"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
