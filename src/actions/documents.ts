"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireStageWork } from "@/lib/authz";
import { deleteFile, putFile } from "@/lib/storage";
import { STAGES } from "@/lib/constants";

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  requireStageWork(user, stageIndex);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Choose a file to upload.");

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await putFile(file.name, buf, file.type || "application/octet-stream");

  const [doc] = await db
    .insert(documents)
    .values({
      studyId,
      stageIndex,
      name: file.name,
      fileType: file.type || null,
      fileRef: stored.ref,
      size: file.size,
      uploadedBy: user.id,
    })
    .returning();

  await logActivity({
    studyId,
    actorId: user.id,
    type: "document.uploaded",
    summary: `Uploaded “${file.name}” to ${STAGES[stageIndex]}`,
    targetRef: doc.id,
  });
  revalidatePath("/", "layout");
}

export async function deleteDocument(formData: FormData) {
  const user = await requireUser();
  const docId = String(formData.get("docId"));
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) throw new Error("Document not found.");
  requireStageWork(user, doc.stageIndex);

  // Removes both the blob and the metadata row (FR-DOC-4), logged.
  await deleteFile(doc.fileRef);
  await db.delete(documents).where(eq(documents.id, docId));
  await logActivity({
    studyId: doc.studyId,
    actorId: user.id,
    type: "document.deleted",
    summary: `Deleted document “${doc.name}”`,
    targetRef: docId,
  });
  revalidatePath("/", "layout");
}
