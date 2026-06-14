"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireCapability } from "@/lib/authz";
import { CAPABILITIES, STAGE_COUNT } from "@/lib/constants";

function parseRoleForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const stageScope: number[] = [];
  for (let i = 0; i < STAGE_COUNT; i++) {
    if (formData.get(`stage_${i}`) === "on") stageScope.push(i);
  }
  const capabilities: Record<string, boolean> = {};
  for (const cap of CAPABILITIES) {
    capabilities[cap] = formData.get(`cap_${cap}`) === "on";
  }
  return { name, stageScope, capabilities };
}

export async function createRole(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_roles");
  const { name, stageScope, capabilities } = parseRoleForm(formData);
  if (!name) throw new Error("Role name is required.");

  await db.insert(roles).values({ name, stageScope, capabilities, isBuiltin: false });
  await logActivity({ actorId: user.id, type: "role.created", summary: `Created role “${name}”` });
  revalidatePath("/", "layout");
}

export async function updateRole(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_roles");
  const id = String(formData.get("id"));
  const { name, stageScope, capabilities } = parseRoleForm(formData);
  if (!name) throw new Error("Role name is required.");

  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) throw new Error("Role not found.");

  // Principal is built-in: keep its full power, never strip manage_users /
  // create_roles (no lock-out, FR-USR / §3).
  if (role.isBuiltin) {
    capabilities.manage_users = true;
    capabilities.create_roles = true;
  }

  await db.update(roles).set({ name, stageScope, capabilities }).where(eq(roles.id, id));
  await logActivity({ actorId: user.id, type: "role.updated", summary: `Updated role “${name}”` });
  revalidatePath("/", "layout");
}

export async function deleteRole(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_roles");
  const id = String(formData.get("id"));
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) throw new Error("Role not found.");
  if (role.isBuiltin) throw new Error("The built-in Principal role cannot be deleted.");

  const [holder] = await db.select({ id: users.id }).from(users).where(eq(users.roleId, id)).limit(1);
  if (holder) throw new Error("Reassign users off this role before deleting it.");

  await db.delete(roles).where(eq(roles.id, id));
  await logActivity({ actorId: user.id, type: "role.deleted", summary: `Deleted role “${role.name}”` });
  revalidatePath("/", "layout");
}
