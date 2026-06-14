import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { notifications, studies } from "@/db/schema";
import { getPageUser } from "@/lib/authz";
import { STAGES, STAGE_COUNT } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { markNotificationRead } from "@/actions/notifications";
import { PageHeader, EmptyState } from "@/components/ui/primitives";

const kindDot: Record<string, string> = {
  review_request: "bg-accent",
  stage_approved: "bg-green",
  stage_sent_back: "bg-amber",
  task_assigned: "bg-accent",
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ studyId: string; stageIndex: string }>;
}) {
  const { studyId, stageIndex: raw } = await params;
  const stageIndex = Number(raw);
  if (Number.isNaN(stageIndex) || stageIndex < 0 || stageIndex >= STAGE_COUNT) notFound();

  const user = await getPageUser();
  const [study] = await db.select().from(studies).where(eq(studies.id, studyId)).limit(1);
  if (!study) notFound();

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.studyId, studyId), eq(notifications.stageIndex, stageIndex)))
    .orderBy(desc(notifications.createdAt));

  return (
    <div>
      <PageHeader eyebrow={`${STAGES[stageIndex]} · ${study.name}`} title="Notifications" />

      {rows.length === 0 ? (
        <EmptyState title="No notifications" hint="Stage events and alerts will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((n) => {
            const mine = n.targetUserId === user.id;
            const unread = mine && !n.readAt;
            return (
              <li
                key={n.id}
                className={[
                  "flex items-center gap-3 rounded-card border bg-surface px-4 py-3",
                  unread ? "border-l-[3px] border-l-accent border-border" : "border-border",
                ].join(" ")}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${kindDot[n.kind] ?? "bg-faint"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-body text-ink">{n.text}</p>
                  <p className="tnum text-meta text-muted">{fmtDateTime(n.createdAt)}{mine ? " · for you" : ""}</p>
                </div>
                {unread && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="btn-ghost text-meta">Mark read</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
