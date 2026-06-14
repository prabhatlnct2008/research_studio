"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, contacts } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireCapability } from "@/lib/authz";

export async function createClient(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_clients");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Client name is required.");

  const [client] = await db
    .insert(clients)
    .values({
      name,
      sector: String(formData.get("sector") || "").trim() || null,
      location: String(formData.get("location") || "").trim() || null,
      status: (String(formData.get("status") || "active") as "lead" | "active" | "dormant"),
      ownerId: user.id,
    })
    .returning();

  await logActivity({
    studyId: null,
    actorId: user.id,
    type: "client.created",
    summary: `Created client “${name}”`,
    targetRef: client.id,
  });

  revalidatePath("/", "layout");
  redirect(`/clients/${client.id}`);
}

export async function updateClientStatus(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_clients");
  const clientId = String(formData.get("clientId"));
  const status = String(formData.get("status")) as "lead" | "active" | "dormant";

  await db.update(clients).set({ status }).where(eq(clients.id, clientId));
  await logActivity({
    actorId: user.id,
    type: "client.status",
    summary: `Set client status to ${status}`,
    targetRef: clientId,
  });
  revalidatePath("/", "layout");
}

export async function addContact(formData: FormData) {
  const user = await requireUser();
  requireCapability(user, "create_clients");
  const clientId = String(formData.get("clientId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const isPrimary = formData.get("isPrimary") === "on";
  if (!name || !email) throw new Error("Contact name and email are required.");

  // At most one primary per client (FR-CLI-2).
  if (isPrimary) {
    await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.clientId, clientId));
  }
  await db.insert(contacts).values({ clientId, name, email, isPrimary });
  await logActivity({
    actorId: user.id,
    type: "contact.added",
    summary: `Added contact ${name}`,
    targetRef: clientId,
  });
  revalidatePath("/", "layout");
}
