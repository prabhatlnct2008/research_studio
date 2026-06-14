import { and, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  clients,
  documents,
  emails,
  notifications,
  stageInstances,
  studies,
  tasks,
  users,
} from "@/db/schema";
import { getPageUser } from "@/lib/authz";
import { studyRisk, getStudyActivity } from "@/lib/data";
import { STAGES, STAGE_STATE_LABELS, type StageState } from "@/lib/constants";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { PageHeader, Tile, SectionTitle } from "@/components/ui/primitives";
import { RiskPill, Pill } from "@/components/ui/pill";
import { StudyBoard } from "@/components/study/board";
import { CloseStudyButton } from "@/components/forms/close-study";
import { ViewToggle } from "@/components/study/view-toggle";

function stateTone(state: StageState): "green" | "accent" | "neutral" | "amber" {
  if (state === "advanced" || state === "approved") return "green";
  if (state === "in_review") return "amber";
  if (state === "in_progress") return "accent";
  return "neutral";
}

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ studyId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { studyId } = await params;
  const { view } = await searchParams;
  const user = await getPageUser();

  const [study] = await db.select().from(studies).where(eq(studies.id, studyId)).limit(1);
  if (!study) notFound();
  const [client] = await db.select().from(clients).where(eq(clients.id, study.clientId)).limit(1);

  const [stageRows, allTasks, emailRows, docRows, notifRows, activeUsers] = await Promise.all([
    db.select().from(stageInstances).where(eq(stageInstances.studyId, studyId)),
    db.select().from(tasks).where(eq(tasks.studyId, studyId)),
    db.select({ stageIndex: emails.stageIndex }).from(emails).where(eq(emails.studyId, studyId)),
    db.select({ stageIndex: documents.stageIndex }).from(documents).where(eq(documents.studyId, studyId)),
    db.select({ stageIndex: notifications.stageIndex }).from(notifications).where(eq(notifications.studyId, studyId)),
    db.select({ id: users.id, name: users.name }).from(users).where(ne(users.status, "disabled")),
  ]);

  const stateByIndex = new Map(stageRows.map((s) => [s.stageIndex, s.state as StageState]));
  const risk = studyRisk(study);
  const openTasks = allTasks.filter((t) => t.status !== "done");
  const lead = study.leadId ? activeUsers.find((u) => u.id === study.leadId) : null;
  const canClose = study.leadId === user.id || !!user.role?.isBuiltin;

  const currentState = stateByIndex.get(study.currentStage) ?? "not_started";
  const nextAction = (() => {
    if (study.status !== "active") return `Study ${study.status}.`;
    switch (currentState) {
      case "in_progress":
        return `Work ${STAGES[study.currentStage]} — complete gate items, then submit for review.`;
      case "in_review":
        return `${STAGES[study.currentStage]} is awaiting review.`;
      case "approved":
        return `${STAGES[study.currentStage]} approved — ready to advance.`;
      default:
        return `${STAGES[study.currentStage]} not started.`;
    }
  })();

  const countFor = (rows: { stageIndex: number }[], idx: number) =>
    rows.filter((r) => r.stageIndex === idx).length;

  if (view === "board") {
    return (
      <div>
        <PageHeader
          eyebrow={`Study · ${client?.name ?? ""}`}
          title={study.name}
          pill={study.status === "active" ? <RiskPill risk={risk} /> : <Pill tone="neutral">{study.status}</Pill>}
          action={<ViewToggle studyId={studyId} active="board" />}
        />
        <StudyBoard
          studyId={studyId}
          currentStage={study.currentStage}
          tasks={allTasks.map((t) => ({
            id: t.id,
            title: t.title,
            stageIndex: t.stageIndex,
            status: t.status,
            dueDate: t.dueDate ? t.dueDate.getTime() : null,
            assigneeName: activeUsers.find((u) => u.id === t.assigneeId)?.name ?? null,
          }))}
          stageStates={Object.fromEntries(stageRows.map((s) => [s.stageIndex, s.state]))}
          canWork={!!user.role?.isBuiltin || user.role?.capabilities?.work_on_stage === true}
          scope={user.role?.isBuiltin ? STAGES.map((_, i) => i) : (user.role?.stageScope ?? [])}
        />
      </div>
    );
  }

  const activity = await getStudyActivity(studyId, 12);

  return (
    <div>
      <PageHeader
        eyebrow={`Study · ${client?.name ?? ""}`}
        title={study.name}
        pill={study.status === "active" ? <RiskPill risk={risk} /> : <Pill tone="neutral">{study.status}</Pill>}
        action={<ViewToggle studyId={studyId} active="overview" />}
      />

      <div className="mb-6 rounded-card border border-accent/30 bg-accent-soft/40 px-4 py-3">
        <p className="eyebrow mb-0.5">Next action</p>
        <p className="text-body text-ink">{nextAction}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-meta text-muted">
        <span>Lead: <span className="text-ink">{lead?.name ?? "—"}</span></span>
        <span>Start: <span className="tnum text-ink">{fmtDate(study.startDate)}</span></span>
        <span>Expected end: <span className="tnum text-ink">{fmtDate(study.expectedEndDate)}</span></span>
        {study.actualEndDate && <span>Closed: <span className="tnum text-ink">{fmtDate(study.actualEndDate)}</span></span>}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={emailRows.length} label="Emails" />
        <Tile value={docRows.length} label="Documents" />
        <Tile value={notifRows.length} label="Notifications" />
        <Tile value={openTasks.length} label="Open tasks" bar="amber" />
      </div>

      <SectionTitle>Stages</SectionTitle>
      <div className="mb-8 flex flex-col gap-2">
        {STAGES.map((name, i) => {
          const state = stateByIndex.get(i) ?? "not_started";
          const isCurrent = i === study.currentStage;
          return (
            <Link
              key={i}
              href={`/studies/${studyId}/stages/${i}`}
              prefetch
              className={[
                "flex min-h-[56px] items-center gap-3 rounded-card border bg-surface px-4 py-3 transition-shadow hover:shadow-hover",
                isCurrent ? "border-accent/40" : "border-border",
              ].join(" ")}
            >
              <span className="tnum w-6 shrink-0 text-meta font-semibold text-faint">{i}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-body font-medium text-ink">
                  {name}
                  {isCurrent && <Pill tone="accent">Current</Pill>}
                </div>
                <div className="text-meta text-muted">
                  {countFor(emailRows, i)} emails · {countFor(docRows, i)} docs
                </div>
              </div>
              <Pill tone={stateTone(state)}>{STAGE_STATE_LABELS[state]}</Pill>
            </Link>
          );
        })}
      </div>

      <div className="mb-8 flex items-center justify-between">
        <SectionTitle>Activity</SectionTitle>
        {study.status === "active" && canClose && <CloseStudyButton studyId={studyId} />}
      </div>
      {activity.length === 0 ? (
        <p className="text-meta text-muted">No activity yet.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-meta">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
              <span className="flex-1 text-ink">
                {a.summary}
                <span className="text-muted"> · {a.actorName ?? "System"}</span>
              </span>
              <span className="tnum shrink-0 text-muted">{fmtDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
