import { and, eq, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, FileText, Mail } from "lucide-react";
import { db } from "@/db";
import {
  documents,
  emails,
  gateItems as gateItemsT,
  notifications,
  roles,
  stageInstances,
  studies,
  tasks as tasksT,
  users,
} from "@/db/schema";
import { getPageUser, canWorkOnStage, hasCapability, inStageScope } from "@/lib/authz";
import { STAGES, STAGE_COUNT, type StageState } from "@/lib/constants";
import { PageHeader } from "@/components/ui/primitives";
import { GateChecklist } from "@/components/stage/gate-checklist";
import { ReviewStrip } from "@/components/stage/review-strip";
import { TaskList } from "@/components/stage/tasks";

function SectionCard({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="card flex flex-col gap-3 p-5 transition-shadow hover:shadow-hover"
    >
      <span className="text-accent">{icon}</span>
      <div>
        <p className="text-card-title font-semibold text-ink">{label}</p>
        <p className="tnum text-meta text-muted">{count} {count === 1 ? "item" : "items"}</p>
      </div>
    </Link>
  );
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ studyId: string; stageIndex: string }>;
}) {
  const { studyId, stageIndex: stageIndexRaw } = await params;
  const stageIndex = Number(stageIndexRaw);
  if (Number.isNaN(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_COUNT) notFound();

  const user = await getPageUser();
  const [study] = await db.select().from(studies).where(eq(studies.id, studyId)).limit(1);
  if (!study) notFound();

  const [si] = await db
    .select()
    .from(stageInstances)
    .where(and(eq(stageInstances.studyId, studyId), eq(stageInstances.stageIndex, stageIndex)))
    .limit(1);
  const state = (si?.state ?? "not_started") as StageState;

  const [gateRows, stageTasks, emailRows, docRows, notifRows, candidateUsers] = await Promise.all([
    db.select().from(gateItemsT).where(and(eq(gateItemsT.studyId, studyId), eq(gateItemsT.stageIndex, stageIndex))).orderBy(gateItemsT.order),
    db.select().from(tasksT).where(and(eq(tasksT.studyId, studyId), eq(tasksT.stageIndex, stageIndex))).orderBy(tasksT.createdAt),
    db.select({ id: emails.id }).from(emails).where(and(eq(emails.studyId, studyId), eq(emails.stageIndex, stageIndex))),
    db.select({ id: documents.id }).from(documents).where(and(eq(documents.studyId, studyId), eq(documents.stageIndex, stageIndex))),
    db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.studyId, studyId), eq(notifications.stageIndex, stageIndex))),
    db
      .select({
        id: users.id,
        name: users.name,
        caps: roles.capabilities,
        scope: roles.stageScope,
        builtin: roles.isBuiltin,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(ne(users.status, "disabled")),
  ]);

  // Resolve gate done-by names.
  const userNames = new Map(candidateUsers.map((u) => [u.id, u.name]));
  const gateItems = gateRows.map((g) => ({
    id: g.id,
    label: g.label,
    status: g.status,
    doneAt: g.doneAt,
    doneByName: g.doneBy ? (userNames.get(g.doneBy) ?? null) : null,
  }));
  const gateRemaining = gateItems.filter((g) => g.status !== "done").length;

  const canWork = study.status === "active" && canWorkOnStage(user, stageIndex);
  const canAdvance = hasCapability(user, "advance_stage") && inStageScope(user, stageIndex);
  const canAssign = hasCapability(user, "assign_tasks");
  const canReviewThis = (() => {
    const me = candidateUsers.find((u) => u.id === user.id);
    if (!me) return false;
    if (me.builtin) return true;
    return (me.caps as Record<string, boolean> | null)?.review_stage === true && (me.scope as number[]).includes(stageIndex);
  })();

  // Eligible reviewers: hold review for this stage, and not the current user.
  const reviewers = candidateUsers
    .filter((u) => u.id !== user.id)
    .filter((u) => u.builtin || ((u.caps as Record<string, boolean> | null)?.review_stage === true && (u.scope as number[]).includes(stageIndex)))
    .map((u) => ({ id: u.id, name: u.name }));

  const base = `/studies/${studyId}/stages/${stageIndex}`;
  const isCurrent = study.currentStage === stageIndex;

  return (
    <div>
      <PageHeader
        eyebrow={`Stage ${stageIndex} · ${study.name}`}
        title={STAGES[stageIndex]}
      />

      <div className="mb-8 grid grid-cols-3 gap-3">
        <SectionCard href={`${base}/emails`} icon={<Mail size={20} />} label="Emails" count={emailRows.length} />
        <SectionCard href={`${base}/notifications`} icon={<Bell size={20} />} label="Notifications" count={notifRows.length} />
        <SectionCard href={`${base}/documents`} icon={<FileText size={20} />} label="Documents" count={docRows.length} />
      </div>

      <div className="mb-8">
        <ReviewStrip
          studyId={studyId}
          stageIndex={stageIndex}
          state={state}
          reviewers={reviewers}
          canWork={canWork}
          canReviewThis={canReviewThis}
          canAdvance={canAdvance}
          isSubmitter={si?.submittedBy === user.id}
          submitterName={si?.submittedBy ? (userNames.get(si.submittedBy) ?? null) : null}
          reviewerName={si?.reviewerId ? (userNames.get(si.reviewerId) ?? null) : null}
          reviewedAt={si?.reviewedAt ? si.reviewedAt.getTime() : si?.advancedAt ? si.advancedAt.getTime() : null}
          reviewNote={si?.reviewNote ?? null}
          gateRemaining={gateRemaining}
          isLastStage={stageIndex === STAGE_COUNT - 1}
          isCurrent={isCurrent}
        />
      </div>

      <div className="mb-8">
        <GateChecklist items={gateItems} canWork={canWork} />
      </div>

      <TaskList
        studyId={studyId}
        stageIndex={stageIndex}
        tasks={stageTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeId ? (userNames.get(t.assigneeId) ?? null) : null,
          dueDate: t.dueDate ? t.dueDate.getTime() : null,
          isMine: t.assigneeId === user.id,
        }))}
        users={candidateUsers.map((u) => ({ id: u.id, name: u.name }))}
        canAssign={canAssign}
        meId={user.id}
      />
    </div>
  );
}
