import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Download, FileText, Trash2 } from "lucide-react";
import { db } from "@/db";
import { documents, studies, users } from "@/db/schema";
import { getPageUser, canWorkOnStage } from "@/lib/authz";
import { STAGES, STAGE_COUNT } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { urlForRef } from "@/lib/storage";
import { deleteDocument } from "@/actions/documents";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { UploadDocument } from "@/components/forms/upload-document";

function fmtSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage({
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
    .select({
      id: documents.id,
      name: documents.name,
      fileType: documents.fileType,
      fileRef: documents.fileRef,
      size: documents.size,
      uploadedAt: documents.uploadedAt,
      uploaderName: users.name,
    })
    .from(documents)
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(and(eq(documents.studyId, studyId), eq(documents.stageIndex, stageIndex)))
    .orderBy(desc(documents.uploadedAt));

  const canWork = study.status === "active" && canWorkOnStage(user, stageIndex);

  return (
    <div>
      <PageHeader
        eyebrow={`${STAGES[stageIndex]} · ${study.name}`}
        title="Documents"
        action={canWork ? <UploadDocument studyId={studyId} stageIndex={stageIndex} /> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState title="No documents yet" hint="Upload deliverables so everything for this phase lives in one place." />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
              <FileText size={18} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">{d.name}</p>
                <p className="tnum text-meta text-muted">
                  {fmtSize(d.size)} · {d.uploaderName ?? "—"} · {fmtDateTime(d.uploadedAt)}
                </p>
              </div>
              <a href={urlForRef(d.fileRef)} target="_blank" rel="noreferrer" className="btn-ghost px-2" title="Download">
                <Download size={16} />
              </a>
              {canWork && (
                <form action={deleteDocument}>
                  <input type="hidden" name="docId" value={d.id} />
                  <button className="btn-ghost px-2 text-muted hover:text-red" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
