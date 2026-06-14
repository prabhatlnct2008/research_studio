import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { roles, users, type Role, type User } from "@/db/schema";
import { auth } from "@/auth";
import type { Capability } from "@/lib/constants";

export type CurrentUser = User & { role: Role | null };

// Loads the signed-in user fresh from the DB (so role changes & disabling take
// effect immediately). Returns null if not signed in or disabled.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return null;

  const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  if (!user || user.status === "disabled") return null;

  let role: Role | null = null;
  if (user.roleId) {
    const [r] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
    role = r ?? null;
  }
  return { ...user, role };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

// For page components: redirect to login instead of throwing when unauthenticated
// (avoids null-deref during the concurrent layout render).
export async function getPageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export class AuthError extends Error {}

// ---------------------------------------------------------------------------
// Capability + stage-scope checks (FRD §3, §5.2). The built-in Principal role
// holds every capability and the full stage scope.
// ---------------------------------------------------------------------------

export function isPrincipal(user: CurrentUser): boolean {
  return !!user.role?.isBuiltin;
}

export function hasCapability(user: CurrentUser, cap: Capability): boolean {
  if (!user.role) return false;
  if (user.role.isBuiltin) return true;
  return user.role.capabilities?.[cap] === true;
}

export function inStageScope(user: CurrentUser, stageIndex: number): boolean {
  if (!user.role) return false;
  if (user.role.isBuiltin) return true;
  return (user.role.stageScope ?? []).includes(stageIndex);
}

// `work_on_stage` capability AND the stage is in the user's scope. Outside
// scope, a role is read-only.
export function canWorkOnStage(user: CurrentUser, stageIndex: number): boolean {
  return hasCapability(user, "work_on_stage") && inStageScope(user, stageIndex);
}

export function requireCapability(user: CurrentUser, cap: Capability): void {
  if (!hasCapability(user, cap)) {
    throw new AuthError(`Missing capability: ${cap}`);
  }
}

export function requireStageWork(user: CurrentUser, stageIndex: number): void {
  if (!canWorkOnStage(user, stageIndex)) {
    throw new AuthError("Outside your stage scope (read-only here).");
  }
}
