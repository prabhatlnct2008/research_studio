// Outbound email (FRD §4.8 / FR-EML-3). Uses Resend when RESEND_API_KEY is set;
// otherwise logs to the console so compose-and-send works in dev.
export type SendResult = { ok: boolean; messageId?: string; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const from = process.env.MAIL_FROM || "Studio <delivery@example.com>";

  if (!process.env.RESEND_API_KEY) {
    console.log("[email:dev]", { from, ...opts });
    return { ok: true, messageId: `dev-${crypto.randomUUID()}` };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
