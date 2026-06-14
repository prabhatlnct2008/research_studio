"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { gateItems, gateTemplateItems, stageInstances, studies } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireCapability } from "@/lib/authz";
import { STAGE_COUNT } from "@/lib/constants";

// Seeds a study's gate items for a stage from the current gate template
// (FR-STU-3 / FR-REV-4). Template edits apply to future seeds only.
export async function seedGateItems(studyId: string, stageIndex: number) {
  const tmpl = await db
    .select()
    .from(gateTemplateItems)
    .where(eq(gateTemplateItems.stageIndex, stageIndex))
    .orderBy(gateTemplateItems.order);
  if (tmpl.length === 0) return;
  await db.insert(gateItems).values(
    tmpl.map((t) => ({
      studyId,
      stageIndex,
      label: t.label,
      order: t.order,
      status: "open" as const,
    })),
  );
}

export async function createStudy(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_studies");

  const clientId = String(formData.get("clientId") || "");
  const name = String(formData.get("name") || "").trim();
  const startRaw = String(formData.get("startDate") || "");
  const endRaw = String(formData.get("expectedEndDate") || "");
  if (!clientId) throw new Error("Client is required.");
  if (!name) throw new Error("Study name is required.");
  if (!startRaw || !endRaw) throw new Error("Start and expected-end dates are required.");

  const startDate = new Date(startRaw);
  const expectedEndDate = new Date(endRaw);
  if (expectedEndDate < startDate) throw new Error("Expected end date must be on or after the start date.");

  const [study] = await db
    .insert(studies)
    .values({
      clientId,
      name,
      type: String(formData.get("type") || "").trim() || null,
      leadId: user.id,
      startDate,
      expectedEndDate,
      currentStage: 0,
      status: "active",
    })
    .returning();

  // Open all 9 stage instances; stage 0 enters in_progress (FR-STU-3).
  for (let i = 0; i < STAGE_COUNT; i++) {
    await db.insert(stageInstances).values({
      studyId: study.id,
      stageIndex: i,
      state: i === 0 ? "in_progress" : "not_started",
      enteredAt: i === 0 ? new Date() : null,
    });
  }
  await seedGateItems(study.id, 0);

  await logActivity({
    studyId: study.id,
    actorId: user.id,
    type: "study.created",
    summary: `Created study “${name}”`,
    targetRef: study.id,
  });

  revalidatePath("/", "layout");
  redirect(`/studies/${study.id}`);
}

export async function closeStudy(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const outcome = String(formData.get("outcome") || "closed") as "closed" | "lost";

  const [study] = await db.select().from(studies).where(eq(studies.id, studyId)).limit(1);
  if (!study) throw new Error("Study not found.");
  // Lead or admin (manage_users implies admin) may close.
  if (study.leadId !== user.id) requireCapability(user, "create_studies");

  await db
    .update(studies)
    .set({ status: outcome, actualEndDate: new Date() })
    .where(eq(studies.id, studyId));

  await logActivity({
    studyId,
    actorId: user.id,
    type: "study.closed",
    summary: `Marked study ${outcome === "lost" ? "lost" : "closed"}`,
    targetRef: studyId,
  });
  revalidatePath("/", "layout");
}

export async function reopenStudy(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_studies");
  const studyId = String(formData.get("studyId"));
  await db.update(studies).set({ status: "active", actualEndDate: null }).where(eq(studies.id, studyId));
  await logActivity({ studyId, actorId: user.id, type: "study.reopened", summary: "Reopened study", targetRef: studyId });
  revalidatePath("/", "layout");
}
