"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { gateTemplateItems } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireCapability } from "@/lib/authz";
import { STAGES } from "@/lib/constants";

// Gate templates (FR-GAT-1) — admin-managed; edits apply to FUTURE studies only.
export async function addTemplateItem(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_gates");
  const stageIndex = Number(formData.get("stageIndex"));
  const label = String(formData.get("label") || "").trim();
  if (!label) throw new Error("Label is required.");

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${gateTemplateItems.order}), -1)` })
    .from(gateTemplateItems)
    .where(eq(gateTemplateItems.stageIndex, stageIndex));

  await db.insert(gateTemplateItems).values({ stageIndex, label, order: (max ?? -1) + 1 });
  await logActivity({
    actorId: user.id,
    type: "gate_template.added",
    summary: `Added gate template item to ${STAGES[stageIndex]}: “${label}”`,
  });
  revalidatePath("/", "layout");
}

export async function updateTemplateItem(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_gates");
  const id = String(formData.get("id"));
  const label = String(formData.get("label") || "").trim();
  if (!label) throw new Error("Label is required.");
  await db.update(gateTemplateItems).set({ label }).where(eq(gateTemplateItems.id, id));
  await logActivity({ actorId: user.id, type: "gate_template.updated", summary: `Edited a gate template item` });
  revalidatePath("/", "layout");
}

export async function deleteTemplateItem(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_gates");
  const id = String(formData.get("id"));
  await db.delete(gateTemplateItems).where(eq(gateTemplateItems.id, id));
  await logActivity({ actorId: user.id, type: "gate_template.removed", summary: `Removed a gate template item` });
  revalidatePath("/", "layout");
}
