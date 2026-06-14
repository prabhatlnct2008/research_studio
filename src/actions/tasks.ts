"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { studies, tasks } from "@/db/schema";
import { logActivity, notify } from "@/lib/activity";
import { requireUser, requireCapability, hasCapability } from "@/lib/authz";
import { STAGES } from "@/lib/constants";

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Task title is required.");

  // Anyone can create a task for themselves; assigning to others needs the
  // assign_tasks capability (FR-TSK-1).
  let assigneeId = String(formData.get("assigneeId") || user.id);
  if (assigneeId !== user.id) requireCapability(user, "assign_tasks");

  const dueRaw = String(formData.get("dueDate") || "");
  const [task] = await db
    .insert(tasks)
    .values({
      studyId,
      stageIndex,
      title,
      description: String(formData.get("description") || "").trim() || null,
      assigneeId,
      reporterId: user.id,
      dueDate: dueRaw ? new Date(dueRaw) : null,
      status: "todo",
    })
    .returning();

  await logActivity({
    studyId,
    actorId: user.id,
    type: "task.created",
    summary: `Created task “${title}” in ${STAGES[stageIndex]}`,
    targetRef: task.id,
  });
  if (assigneeId !== user.id)
    await notify({
      studyId,
      stageIndex,
      kind: "task_assigned",
      text: `Task assigned: ${title}`,
      targetUserId: assigneeId,
      link: `/studies/${studyId}/stages/${stageIndex}`,
    });
  revalidatePath("/", "layout");
}

export async function updateTaskStatus(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId"));
  const status = String(formData.get("status")) as "todo" | "in_progress" | "in_review" | "done";
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) throw new Error("Task not found.");
  if (task.assigneeId !== user.id && task.reporterId !== user.id && !hasCapability(user, "assign_tasks"))
    throw new Error("Not permitted to update this task.");

  await db.update(tasks).set({ status, updatedAt: new Date() }).where(eq(tasks.id, taskId));
  await logActivity({
    studyId: task.studyId,
    actorId: user.id,
    type: "task.status",
    summary: `Task “${task.title}” → ${status.replace("_", " ")}`,
    targetRef: taskId,
  });
  revalidatePath("/", "layout");
}

// Kanban move: change a task's stage, subject to the mover's scope (FR-KAN-4).
export async function moveTaskStage(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId"));
  const toStage = Number(formData.get("toStage"));
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) throw new Error("Task not found.");
  if (!hasCapability(user, "work_on_stage")) throw new Error("Not permitted.");
  const { inStageScope } = await import("@/lib/authz");
  if (!inStageScope(user, toStage)) throw new Error("Target stage is outside your scope.");

  await db.update(tasks).set({ stageIndex: toStage, updatedAt: new Date() }).where(eq(tasks.id, taskId));
  await logActivity({
    studyId: task.studyId,
    actorId: user.id,
    type: "task.moved",
    summary: `Moved task “${task.title}” → ${STAGES[toStage]}`,
    targetRef: taskId,
  });
  revalidatePath("/", "layout");
}
