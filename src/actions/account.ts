"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/authz";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function changePassword(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (next.length < 8) return "New password must be at least 8 characters.";
  if (next !== confirm) return "New passwords do not match.";

  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row?.passwordHash || !(await verifyPassword(current, row.passwordHash))) {
    return "Current password is incorrect.";
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
    .where(eq(users.id, user.id));
  await logActivity({ actorId: user.id, type: "user.password_changed", summary: "Changed own password" });
  return "ok";
}
