import { db } from "@/db";
import { activityLog, notifications } from "@/db/schema";

// Append-only audit entry (FRD §4.14). Every state change MUST call this.
export async function logActivity(opts: {
  studyId?: string | null;
  actorId: string;
  type: string;
  summary: string;
  targetRef?: string | null;
}) {
  await db.insert(activityLog).values({
    studyId: opts.studyId ?? null,
    actorId: opts.actorId,
    type: opts.type,
    summary: opts.summary,
    targetRef: opts.targetRef ?? null,
  });
}

// Notifications (FRD §4.10). A targetUserId makes it drive "pending on you".
export async function notify(opts: {
  studyId?: string | null;
  stageIndex?: number | null;
  kind: string;
  text: string;
  targetUserId?: string | null;
  link?: string | null;
}) {
  await db.insert(notifications).values({
    studyId: opts.studyId ?? null,
    stageIndex: opts.stageIndex ?? null,
    kind: opts.kind,
    text: opts.text,
    targetUserId: opts.targetUserId ?? null,
    link: opts.link ?? null,
  });
}
