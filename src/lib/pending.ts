import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { notifications, stageInstances, studies, tasks } from "@/db/schema";
import { STAGES } from "@/lib/constants";

export type PendingItem = {
  id: string;
  kind: "task" | "review" | "next_action" | "notification";
  label: string;
  sublabel: string;
  studyId: string;
  stageIndex: number | null;
  link: string;
  hint: string; // right-aligned status (e.g. "In progress", "Due 18 Jan", "Overdue")
  overdue: boolean;
};

export type Pending = {
  items: PendingItem[];
  byClient: Record<string, number>;
  byStudy: Record<string, number>;
  byStage: Record<string, number>; // key `${studyId}:${stageIndex}`
  bell: number;
};

// "Pending on you" (FRD §4.13 / FR-PND-1): open tasks assigned to you, stages
// awaiting your review, owned next actions, and unread targeted notifications.
export async function getPending(userId: string): Promise<Pending> {
  const studyClient = new Map<string, string>();
  const studyName = new Map<string, string>();
  for (const s of await db.select().from(studies)) {
    studyClient.set(s.id, s.clientId);
    studyName.set(s.id, s.name);
  }

  const items: PendingItem[] = [];

  // Open tasks assigned to me.
  const myTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assigneeId, userId), ne(tasks.status, "done")));
  for (const t of myTasks) {
    const overdue = !!t.dueDate && t.dueDate.getTime() < Date.now();
    items.push({
      id: `task:${t.id}`,
      kind: "task",
      label: t.title,
      sublabel: `${studyName.get(t.studyId) ?? "Study"} · ${STAGES[t.stageIndex]}`,
      studyId: t.studyId,
      stageIndex: t.stageIndex,
      link: `/studies/${t.studyId}/stages/${t.stageIndex}`,
      hint: t.dueDate
        ? overdue
          ? "Overdue"
          : `Due ${t.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
        : t.status === "in_progress"
          ? "In progress"
          : "Open",
      overdue,
    });
  }

  // Stages awaiting my review.
  const myReviews = await db
    .select()
    .from(stageInstances)
    .where(and(eq(stageInstances.reviewerId, userId), eq(stageInstances.state, "in_review")));
  for (const si of myReviews) {
    items.push({
      id: `review:${si.id}`,
      kind: "review",
      label: `Review ${STAGES[si.stageIndex]}`,
      sublabel: `${studyName.get(si.studyId) ?? "Study"} · awaiting your approval`,
      studyId: si.studyId,
      stageIndex: si.stageIndex,
      link: `/studies/${si.studyId}/stages/${si.stageIndex}`,
      hint: "Needs review",
      overdue: false,
    });
  }

  // Owned next action: a study I lead whose current stage is approved and ready
  // to advance (the advance is on me).
  const myStudies = await db
    .select()
    .from(studies)
    .where(and(eq(studies.leadId, userId), eq(studies.status, "active")));
  for (const s of myStudies) {
    const [si] = await db
      .select()
      .from(stageInstances)
      .where(and(eq(stageInstances.studyId, s.id), eq(stageInstances.stageIndex, s.currentStage)))
      .limit(1);
    if (si?.state === "approved") {
      items.push({
        id: `advance:${s.id}`,
        kind: "next_action",
        label: `Advance ${STAGES[s.currentStage]}`,
        sublabel: `${s.name} · approved, ready to advance`,
        studyId: s.id,
        stageIndex: s.currentStage,
        link: `/studies/${s.id}/stages/${s.currentStage}`,
        hint: "Ready",
        overdue: false,
      });
    }
  }

  // Unread targeted notifications.
  const myNotifs = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.targetUserId, userId), isNull(notifications.readAt)));
  for (const n of myNotifs) {
    items.push({
      id: `notif:${n.id}`,
      kind: "notification",
      label: n.text,
      sublabel: n.studyId ? (studyName.get(n.studyId) ?? "Workspace") : "Workspace",
      studyId: n.studyId ?? "",
      stageIndex: n.stageIndex,
      link: n.link ?? (n.studyId ? `/studies/${n.studyId}` : "/"),
      hint: "Unread",
      overdue: false,
    });
  }

  // Roll up counts for badges (bubble up Stage → Study → Client).
  const byStage: Record<string, number> = {};
  const byStudy: Record<string, number> = {};
  const byClient: Record<string, number> = {};
  for (const it of items) {
    if (it.studyId) {
      byStudy[it.studyId] = (byStudy[it.studyId] ?? 0) + 1;
      const clientId = studyClient.get(it.studyId);
      if (clientId) byClient[clientId] = (byClient[clientId] ?? 0) + 1;
      if (it.stageIndex != null) {
        const k = `${it.studyId}:${it.stageIndex}`;
        byStage[k] = (byStage[k] ?? 0) + 1;
      }
    }
  }

  // Most-urgent first: overdue, then reviews, then the rest.
  const order = { review: 0, next_action: 1, task: 2, notification: 3 } as const;
  items.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return order[a.kind] - order[b.kind];
  });

  return { items, byClient, byStudy, byStage, bell: items.length };
}
