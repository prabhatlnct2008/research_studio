"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireCapability } from "@/lib/authz";
import { generateTempPassword, hashPassword } from "@/lib/password";

export type InviteResult =
  | { ok: true; email: string; tempPassword: string }
  | { ok: false; error: string };

function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// How many active users hold the built-in Principal role? Used to guard against
// locking out admins (FR-USR-5).
async function activePrincipalCount(excludeUserId?: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.status, "active"), eq(roles.isBuiltin, true)));
  return rows.filter((r) => r.id !== excludeUserId).length;
}

export async function inviteUser(_prev: InviteResult | undefined, formData: FormData): Promise<InviteResult> {
  const user = await requireUser();
  requireCapability(user, "manage_users");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") || "") || null;
  if (!name) return { ok: false, error: "Name is required." };
  if (!validEmail(email)) return { ok: false, error: "A valid email is required." };

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { ok: false, error: "A user with that email already exists." };

  const tempPassword = generateTempPassword();
  await db.insert(users).values({
    name,
    email,
    passwordHash: await hashPassword(tempPassword),
    mustChangePassword: true,
    roleId,
    status: "active",
    invitedBy: user.id,
  });

  await logActivity({
    actorId: user.id,
    type: "user.invited",
    summary: `Added user ${name} (${email})`,
  });
  revalidatePath("/", "layout");
  return { ok: true, email, tempPassword };
}

export async function changeUserRole(formData: FormData) {
  const admin = await requireUser();
  requireCapability(admin, "manage_users");
  const userId = String(formData.get("userId"));
  const roleId = String(formData.get("roleId") || "") || null;

  const [target] = await db
    .select({ status: users.status, builtin: roles.isBuiltin })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  // Moving the last active Principal off the Principal role is rejected.
  if (target?.builtin && target.status === "active") {
    const [newRole] = roleId
      ? await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
      : [undefined];
    if (!newRole?.isBuiltin && (await activePrincipalCount(userId)) === 0) {
      throw new Error("Cannot remove the last active Principal.");
    }
  }

  await db.update(users).set({ roleId }).where(eq(users.id, userId));
  await logActivity({ actorId: admin.id, type: "user.role_changed", summary: `Changed a user's role` });
  revalidatePath("/", "layout");
}

export async function setUserStatus(formData: FormData) {
  const admin = await requireUser();
  requireCapability(admin, "manage_users");
  const userId = String(formData.get("userId"));
  const status = String(formData.get("status")) as "active" | "disabled";

  if (status === "disabled" && (await activePrincipalCount(userId)) === 0) {
    const [target] = await db
      .select({ builtin: roles.isBuiltin })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);
    if (target?.builtin) throw new Error("Cannot disable the last active Principal.");
  }

  // Never hard-delete — disable only (FR-USR-3).
  await db.update(users).set({ status }).where(eq(users.id, userId));
  await logActivity({
    actorId: admin.id,
    type: "user.status",
    summary: status === "disabled" ? "Disabled a user" : "Re-activated a user",
    targetRef: userId,
  });
  revalidatePath("/", "layout");
}

export async function resetUserPassword(_prev: InviteResult | undefined, formData: FormData): Promise<InviteResult> {
  const admin = await requireUser();
  requireCapability(admin, "manage_users");
  const userId = String(formData.get("userId"));
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, error: "User not found." };

  const tempPassword = generateTempPassword();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(tempPassword), mustChangePassword: true })
    .where(eq(users.id, userId));
  await logActivity({ actorId: admin.id, type: "user.password_reset", summary: `Issued a temp password to ${target.name}` });
  revalidatePath("/", "layout");
  return { ok: true, email: target.email, tempPassword };
}
