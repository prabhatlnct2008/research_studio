"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { gateItems, roles, stageInstances, studies, users } from "@/db/schema";
import { logActivity, notify } from "@/lib/activity";
import { requireUser, requireStageWork, requireCapability, AuthError, inStageScope, hasCapability } from "@/lib/authz";
import { STAGES, STAGE_COUNT } from "@/lib/constants";
import { seedGateItems } from "./studies";

async function loadStage(studyId: string, stageIndex: number) {
  const [si] = await db
    .select()
    .from(stageInstances)
    .where(and(eq(stageInstances.studyId, studyId), eq(stageInstances.stageIndex, stageIndex)))
    .limit(1);
  if (!si) throw new Error("Stage not found.");
  return si;
}

// Does the given user hold review capability AND scope for this stage?
async function userCanReview(userId: string, stageIndex: number): Promise<boolean> {
  const [row] = await db
    .select({ caps: roles.capabilities, scope: roles.stageScope, builtin: roles.isBuiltin })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || !row.scope) return false;
  if (row.builtin) return true;
  const hasCap = (row.caps as Record<string, boolean> | null)?.review_stage === true;
  const inScope = (row.scope as number[]).includes(stageIndex);
  return hasCap && inScope;
}

export async function toggleGateItem(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId"));
  const [item] = await db.select().from(gateItems).where(eq(gateItems.id, itemId)).limit(1);
  if (!item) throw new Error("Gate item not found.");
  requireStageWork(user, item.stageIndex);

  // Cycle open → wip → done → open.
  const next = item.status === "open" ? "wip" : item.status === "wip" ? "done" : "open";
  await db
    .update(gateItems)
    .set({
      status: next,
      doneBy: next === "done" ? user.id : null,
      doneAt: next === "done" ? new Date() : null,
    })
    .where(eq(gateItems.id, itemId));

  await logActivity({
    studyId: item.studyId,
    actorId: user.id,
    type: "gate.toggle",
    summary: `Gate “${item.label}” → ${next}`,
    targetRef: itemId,
  });
  revalidatePath("/", "layout");
}

export async function submitForReview(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  const reviewerId = String(formData.get("reviewerId") || "");

  requireStageWork(user, stageIndex);
  const si = await loadStage(studyId, stageIndex);
  if (si.state !== "in_progress") throw new AuthError("Stage is not in progress.");
  if (!reviewerId) throw new Error("Choose a reviewer.");
  if (reviewerId === user.id) throw new AuthError("Reviewer must be a different user.");
  if (!(await userCanReview(reviewerId, stageIndex)))
    throw new AuthError("Chosen reviewer lacks the review capability for this stage.");

  await db
    .update(stageInstances)
    .set({ state: "in_review", submittedBy: user.id, submittedAt: new Date(), reviewerId, reviewNote: null })
    .where(eq(stageInstances.id, si.id));

  await logActivity({
    studyId,
    actorId: user.id,
    type: "stage.submitted",
    summary: `Submitted ${STAGES[stageIndex]} for review`,
    targetRef: si.id,
  });
  await notify({
    studyId,
    stageIndex,
    kind: "review_request",
    text: `Review requested: ${STAGES[stageIndex]}`,
    targetUserId: reviewerId,
    link: `/studies/${studyId}/stages/${stageIndex}`,
  });
  revalidatePath("/", "layout");
}

export async function approveStage(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  const si = await loadStage(studyId, stageIndex);

  if (si.state !== "in_review") throw new AuthError("Stage is not in review.");
  if (si.submittedBy === user.id) throw new AuthError("You cannot approve your own submission.");
  if (!(await userCanReview(user.id, stageIndex)))
    throw new AuthError("You lack the review capability for this stage.");

  await db
    .update(stageInstances)
    .set({ state: "approved", reviewerId: user.id, reviewedAt: new Date() })
    .where(eq(stageInstances.id, si.id));

  await logActivity({
    studyId,
    actorId: user.id,
    type: "stage.approved",
    summary: `Approved ${STAGES[stageIndex]}`,
    targetRef: si.id,
  });
  if (si.submittedBy)
    await notify({
      studyId,
      stageIndex,
      kind: "stage_approved",
      text: `${STAGES[stageIndex]} approved — ready to advance`,
      targetUserId: si.submittedBy,
      link: `/studies/${studyId}/stages/${stageIndex}`,
    });
  revalidatePath("/", "layout");
}

export async function sendBackStage(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  const note = String(formData.get("note") || "").trim();
  const si = await loadStage(studyId, stageIndex);

  if (si.state !== "in_review") throw new AuthError("Stage is not in review.");
  if (si.submittedBy === user.id) throw new AuthError("You cannot review your own submission.");
  if (!(await userCanReview(user.id, stageIndex)))
    throw new AuthError("You lack the review capability for this stage.");

  await db
    .update(stageInstances)
    .set({ state: "in_progress", reviewedAt: new Date(), reviewerId: user.id, reviewNote: note || "Sent back" })
    .where(eq(stageInstances.id, si.id));

  await logActivity({
    studyId,
    actorId: user.id,
    type: "stage.sent_back",
    summary: `Sent back ${STAGES[stageIndex]}${note ? `: ${note}` : ""}`,
    targetRef: si.id,
  });
  if (si.submittedBy)
    await notify({
      studyId,
      stageIndex,
      kind: "stage_sent_back",
      text: `${STAGES[stageIndex]} sent back${note ? `: ${note}` : ""}`,
      targetUserId: si.submittedBy,
      link: `/studies/${studyId}/stages/${stageIndex}`,
    });
  revalidatePath("/", "layout");
}

export async function advanceStage(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "advance_stage");
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  if (!inStageScope(user, stageIndex)) throw new AuthError("Outside your stage scope.");

  const si = await loadStage(studyId, stageIndex);
  if (si.state !== "approved") throw new AuthError("Stage must be approved before advancing.");

  await db
    .update(stageInstances)
    .set({ state: "advanced", advancedBy: user.id, advancedAt: new Date() })
    .where(eq(stageInstances.id, si.id));

  const next = stageIndex + 1;
  if (next < STAGE_COUNT) {
    await db
      .update(stageInstances)
      .set({ state: "in_progress", enteredAt: new Date() })
      .where(and(eq(stageInstances.studyId, studyId), eq(stageInstances.stageIndex, next)));
    await db.update(studies).set({ currentStage: next }).where(eq(studies.id, studyId));
    // Seed the next stage's gate items if not already seeded.
    const existing = await db
      .select({ id: gateItems.id })
      .from(gateItems)
      .where(and(eq(gateItems.studyId, studyId), eq(gateItems.stageIndex, next)))
      .limit(1);
    if (existing.length === 0) await seedGateItems(studyId, next);
  }

  await logActivity({
    studyId,
    actorId: user.id,
    type: "stage.advanced",
    summary: `Advanced ${STAGES[stageIndex]}${next < STAGE_COUNT ? ` → ${STAGES[next]}` : " (final stage)"}`,
    targetRef: si.id,
  });
  revalidatePath("/", "layout");
}
