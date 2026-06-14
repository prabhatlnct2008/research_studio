"use client";

import { useState, useTransition } from "react";
import { STAGES, STAGE_STATE_LABELS, PHASE_BANDS, type StageState } from "@/lib/constants";
import { moveTaskStage } from "@/actions/tasks";

type Card = {
  id: string;
  title: string;
  stageIndex: number;
  status: string;
  dueDate: number | null;
  assigneeName: string | null;
};

const statusDot: Record<string, string> = {
  todo: "bg-faint",
  in_progress: "bg-accent",
  in_review: "bg-amber",
  done: "bg-green",
};

export function StudyBoard({
  studyId,
  currentStage,
  tasks,
  stageStates,
  canWork,
  scope,
}: {
  studyId: string;
  currentStage: number;
  tasks: Card[];
  stageStates: Record<number, string>;
  canWork: boolean;
  scope: number[];
}) {
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const open = items.filter((t) => t.status !== "done");

  function onDrop(toStage: number) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = items.find((t) => t.id === id);
    if (!task || task.stageIndex === toStage) return;
    if (!canWork || !scope.includes(toStage)) return; // mover's scope (FR-KAN-4)

    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, stageIndex: toStage } : t)));
    const fd = new FormData();
    fd.set("taskId", id);
    fd.set("toStage", String(toStage));
    startTransition(() => {
      moveTaskStage(fd);
    });
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-4">
      <div className="mb-2 flex gap-2" style={{ minWidth: 9 * 232 }}>
        {PHASE_BANDS.map((band) => (
          <div
            key={band.label}
            className="eyebrow rounded-[8px] bg-surface-2 py-1 text-center text-muted"
            style={{ width: band.stages.length * 232 - 8 }}
          >
            {band.label}
          </div>
        ))}
      </div>
      <div className="flex gap-2" style={{ minWidth: 9 * 232 }}>
        {STAGES.map((name, i) => {
          const state = (stageStates[i] ?? "not_started") as StageState;
          const colTasks = open.filter((t) => t.stageIndex === i);
          const isCurrent = i === currentStage;
          const droppable = canWork && scope.includes(i);
          return (
            <div
              key={i}
              onDragOver={(e) => {
                if (droppable) {
                  e.preventDefault();
                  setOverStage(i);
                }
              }}
              onDragLeave={() => setOverStage((s) => (s === i ? null : s))}
              onDrop={() => onDrop(i)}
              className={[
                "flex w-56 shrink-0 flex-col rounded-card border bg-surface-2/40 p-2",
                isCurrent ? "border-accent/50" : "border-border",
                overStage === i ? "ring-2 ring-accent-soft" : "",
              ].join(" ")}
            >
              <div className="mb-2 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-meta font-semibold text-ink">{name}</span>
                  <span className="count-badge">{colTasks.length}</span>
                </div>
                <span className="text-[11px] text-muted">{STAGE_STATE_LABELS[state]}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable={droppable}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    className={[
                      "rounded-[10px] border border-border bg-surface p-2.5 text-meta",
                      droppable ? "cursor-grab active:cursor-grabbing" : "",
                      dragId === t.id ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusDot[t.status]}`} aria-hidden />
                      <span className="flex-1 text-ink">{t.title}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between pl-3.5 text-[11px] text-muted">
                      <span className="truncate">{t.assigneeName ?? "Unassigned"}</span>
                      {t.dueDate && (
                        <span className="tnum">
                          {new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="px-1 py-2 text-[11px] text-faint">No open tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!canWork && (
        <p className="mt-3 text-meta text-muted">You have read-only access — cards can't be moved.</p>
      )}
    </div>
  );
}
