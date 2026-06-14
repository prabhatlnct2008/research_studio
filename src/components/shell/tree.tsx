"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  FlaskConical,
  Mail,
} from "lucide-react";
import { useShell } from "./shell-context";
import { STAGES } from "@/lib/constants";
import type { Risk, StageNode } from "@/lib/data";

const riskColor: Record<Risk, string> = {
  track: "bg-green",
  watch: "bg-amber",
  risk: "bg-red",
};

function stageDot(state: string, isCurrent: boolean) {
  if (state === "advanced" || state === "approved") return "bg-green";
  if (isCurrent || state === "in_progress" || state === "in_review") return "bg-accent";
  return "bg-faint/50";
}

function Row({
  depth,
  href,
  active,
  hasChildren,
  expanded,
  onToggle,
  icon,
  label,
  marker,
  badge,
  onNavigate,
}: {
  depth: number;
  href: string;
  active: boolean;
  hasChildren: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  icon: React.ReactNode;
  label: string;
  marker?: React.ReactNode;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={[
        "group flex items-center gap-1 rounded-[8px] pr-2",
        active ? "bg-accent-soft" : "hover:bg-surface-2",
      ].join(" ")}
      style={{ paddingLeft: 4 + depth * 15 }}
    >
      <button
        onClick={onToggle}
        className={["flex h-7 w-5 shrink-0 items-center justify-center", hasChildren ? "" : "invisible"].join(" ")}
        aria-label={expanded ? "Collapse" : "Expand"}
        tabIndex={hasChildren ? 0 : -1}
      >
        <ChevronRight
          size={14}
          className={["text-faint transition-transform", expanded ? "rotate-90" : ""].join(" ")}
        />
      </button>
      <Link
        href={href}
        onClick={onNavigate}
        prefetch
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5"
      >
        <span className="shrink-0 text-muted">{icon}</span>
        <span className={["min-w-0 flex-1 truncate text-meta", active ? "font-semibold text-ink" : "text-ink"].join(" ")}>
          {label}
        </span>
        {marker}
        {!!badge && badge > 0 && <span className="count-badge">{badge}</span>}
      </Link>
    </div>
  );
}

export function Tree({ onNavigate }: { onNavigate?: () => void }) {
  const { tree, pending } = useShell();
  const pathname = usePathname();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  return (
    <nav className="px-3" aria-label="Workspace tree">
      <p className="eyebrow px-1 pb-2 pt-2">Clients</p>
      {tree.length === 0 && (
        <p className="px-2 py-2 text-meta text-muted">No clients yet.</p>
      )}
      {tree.map((c) => {
        const cOpen = open.has(c.id);
        return (
          <div key={c.id}>
            <Row
              depth={0}
              href={`/clients/${c.id}`}
              active={pathname === `/clients/${c.id}`}
              hasChildren={c.studies.length > 0}
              expanded={cOpen}
              onToggle={() => toggle(c.id)}
              icon={<Building2 size={16} />}
              label={c.name}
              badge={pending.byClient[c.id]}
              onNavigate={onNavigate}
            />
            {cOpen &&
              c.studies.map((s) => {
                const sOpen = open.has(s.id);
                return (
                  <div key={s.id}>
                    <Row
                      depth={1}
                      href={`/studies/${s.id}`}
                      active={pathname === `/studies/${s.id}`}
                      hasChildren
                      expanded={sOpen}
                      onToggle={() => toggle(s.id)}
                      icon={<FlaskConical size={16} />}
                      label={s.name}
                      marker={<span className={`h-2 w-2 rounded-full ${riskColor[s.risk]}`} aria-hidden />}
                      badge={pending.byStudy[s.id]}
                      onNavigate={onNavigate}
                    />
                    {sOpen &&
                      s.stages.map((st) => (
                        <StageBranch
                          key={st.index}
                          study={s.id}
                          studyCurrent={s.currentStage}
                          stage={st}
                          open={open}
                          toggle={toggle}
                          pathname={pathname}
                          pendingStage={pending.byStage[`${s.id}:${st.index}`]}
                          onNavigate={onNavigate}
                        />
                      ))}
                  </div>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}

function StageBranch({
  study,
  studyCurrent,
  stage,
  open,
  toggle,
  pathname,
  pendingStage,
  onNavigate,
}: {
  study: string;
  studyCurrent: number;
  stage: StageNode;
  open: Set<string>;
  toggle: (k: string) => void;
  pathname: string;
  pendingStage?: number;
  onNavigate?: () => void;
}) {
  const key = `${study}:${stage.index}`;
  const stOpen = open.has(key);
  const base = `/studies/${study}/stages/${stage.index}`;
  const isCurrent = studyCurrent === stage.index;

  return (
    <div>
      <Row
        depth={2}
        href={base}
        active={pathname === base}
        hasChildren
        expanded={stOpen}
        onToggle={() => toggle(key)}
        icon={<span className={`h-2 w-2 rounded-full ${stageDot(stage.state, isCurrent)}`} aria-hidden />}
        label={STAGES[stage.index]}
        badge={pendingStage}
        onNavigate={onNavigate}
      />
      {stOpen && (
        <>
          <SectionRow href={`${base}/emails`} active={pathname === `${base}/emails`} icon={<Mail size={15} />} label="Emails" count={stage.emails} onNavigate={onNavigate} />
          <SectionRow href={`${base}/notifications`} active={pathname === `${base}/notifications`} icon={<Bell size={15} />} label="Notifications" count={stage.notifications} onNavigate={onNavigate} />
          <SectionRow href={`${base}/documents`} active={pathname === `${base}/documents`} icon={<FileText size={15} />} label="Documents" count={stage.documents} onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
}

function SectionRow({
  href,
  active,
  icon,
  label,
  count,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={["flex items-center rounded-[8px] pr-2", active ? "bg-accent-soft" : "hover:bg-surface-2"].join(" ")}
      style={{ paddingLeft: 4 + 3 * 15 }}
    >
      <span className="w-5 shrink-0" />
      <Link href={href} onClick={onNavigate} prefetch className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
        <span className="shrink-0 text-muted">{icon}</span>
        <span className={["min-w-0 flex-1 truncate text-meta", active ? "font-semibold text-ink" : "text-ink"].join(" ")}>
          {label}
        </span>
        {count > 0 && <span className="count-badge">{count}</span>}
      </Link>
    </div>
  );
}
