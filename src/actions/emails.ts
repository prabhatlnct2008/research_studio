"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireUser, requireStageWork } from "@/lib/authz";
import { putFile } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { STAGES } from "@/lib/constants";

// Import .eml/.msg into a stage, parsed into a thread (FR-EML-1/2/4).
export async function importEmail(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  requireStageWork(user, stageIndex);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Choose an .eml or .msg file.");

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await putFile(file.name, buf, "message/rfc822");

  let from = "unknown";
  let to = "";
  let subject = file.name;
  let body = "";
  let occurredAt = new Date();
  let messageId: string | null = null;

  // .eml is RFC822 → parse with postal-mime. .msg (Outlook) isn't parsed here;
  // we retain the raw file and record minimal metadata.
  if (file.name.toLowerCase().endsWith(".eml")) {
    try {
      const PostalMime = (await import("postal-mime")).default;
      const parsed = await PostalMime.parse(buf);
      from = parsed.from?.address || from;
      to = (parsed.to || []).map((t) => t.address).filter(Boolean).join(", ");
      subject = parsed.subject || subject;
      body = parsed.text || parsed.html?.replace(/<[^>]+>/g, " ") || "";
      occurredAt = parsed.date ? new Date(parsed.date) : occurredAt;
      messageId = parsed.messageId || null;
    } catch {
      // fall through with minimal metadata
    }
  }

  // Group into a thread by normalized subject.
  const threadId = subject.replace(/^(re|fwd):\s*/i, "").trim().toLowerCase() || crypto.randomUUID();

  const [email] = await db
    .insert(emails)
    .values({
      studyId,
      stageIndex,
      threadId,
      direction: "inbound",
      fromAddr: from,
      toAddr: to,
      subject,
      body,
      occurredAt,
      source: "upload",
      rawFileRef: stored.ref,
      messageId,
      status: "logged",
      createdBy: user.id,
    })
    .returning();

  await logActivity({
    studyId,
    actorId: user.id,
    type: "email.imported",
    summary: `Imported email “${subject}” into ${STAGES[stageIndex]}`,
    targetRef: email.id,
  });
  revalidatePath("/", "layout");
}

// Compose + send an outbound email; reply_to = acting user (FR-EML-3).
export async function composeEmail(formData: FormData) {
  const user = await requireUser();
  const studyId = String(formData.get("studyId"));
  const stageIndex = Number(formData.get("stageIndex"));
  requireStageWork(user, stageIndex);

  const to = String(formData.get("to") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "");
  if (!to || !subject) throw new Error("Recipient and subject are required.");

  const result = await sendEmail({ to, subject, text: body, replyTo: user.email });
  const threadId = subject.replace(/^(re|fwd):\s*/i, "").trim().toLowerCase() || crypto.randomUUID();

  const [email] = await db
    .insert(emails)
    .values({
      studyId,
      stageIndex,
      threadId,
      direction: "outbound",
      fromAddr: user.email,
      toAddr: to,
      subject,
      body,
      occurredAt: new Date(),
      source: "compose",
      messageId: result.messageId || null,
      status: result.ok ? "sent" : "failed",
      createdBy: user.id,
    })
    .returning();

  await logActivity({
    studyId,
    actorId: user.id,
    type: result.ok ? "email.sent" : "email.failed",
    summary: result.ok ? `Sent email “${subject}” to ${to}` : `Email send failed: ${result.error}`,
    targetRef: email.id,
  });
  revalidatePath("/", "layout");
  if (!result.ok) throw new Error(`Send failed: ${result.error}`);
}
