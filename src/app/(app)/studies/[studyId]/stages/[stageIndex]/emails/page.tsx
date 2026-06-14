import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { emails, studies } from "@/db/schema";
import { getPageUser, canWorkOnStage } from "@/lib/authz";
import { STAGES, STAGE_COUNT } from "@/lib/constants";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { EmailActions } from "@/components/forms/email-actions";
import { EmailThread } from "@/components/stage/email-thread";

export default async function EmailsPage({
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
    .from(emails)
    .where(and(eq(emails.studyId, studyId), eq(emails.stageIndex, stageIndex)))
    .orderBy(asc(emails.occurredAt));

  // Group into threads.
  const threads = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!threads.has(r.threadId)) threads.set(r.threadId, []);
    threads.get(r.threadId)!.push(r);
  }

  const canWork = study.status === "active" && canWorkOnStage(user, stageIndex);

  return (
    <div>
      <PageHeader
        eyebrow={`${STAGES[stageIndex]} · ${study.name}`}
        title="Emails"
        action={canWork ? <EmailActions studyId={studyId} stageIndex={stageIndex} /> : undefined}
      />

      {threads.size === 0 ? (
        <EmptyState title="No emails yet" hint="Import an .eml file or compose a message to start the record for this stage." />
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from(threads.values()).map((msgs) => (
            <EmailThread
              key={msgs[0].threadId}
              subject={msgs[msgs.length - 1].subject ?? msgs[0].subject ?? ""}
              messages={msgs.map((m) => ({
                id: m.id,
                direction: m.direction,
                fromAddr: m.fromAddr,
                toAddr: m.toAddr,
                subject: m.subject,
                body: m.body,
                occurredAt: m.occurredAt.getTime(),
                status: m.status,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
