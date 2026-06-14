"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/authz";

export async function markNotificationRead(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  // Read state is per user; only the target can mark their own (FR-NOT-3).
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.targetUserId, user.id)));
  revalidatePath("/", "layout");
}

export async function markAllRead() {
  const user = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.targetUserId, user.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
}
