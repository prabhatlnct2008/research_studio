"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Send } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { composeEmail, importEmail } from "@/actions/emails";

export function EmailActions({ studyId, stageIndex }: { studyId: string; stageIndex: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <form action={(fd) => start(() => importEmail(fd).then(() => { if (fileRef.current) fileRef.current.value = ""; }))}>
        <input type="hidden" name="studyId" value={studyId} />
        <input type="hidden" name="stageIndex" value={stageIndex} />
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".eml,.msg"
          className="hidden"
          onChange={(e) => e.target.form?.requestSubmit()}
        />
        <button type="button" className="btn-secondary text-meta" onClick={() => fileRef.current?.click()} disabled={pending}>
          <Paperclip size={15} /> Import .eml
        </button>
      </form>

      <Dialog
        title="Compose email"
        trigger={(open) => (
          <button className="btn-primary text-meta" onClick={open}>
            <Send size={15} /> Compose
          </button>
        )}
      >
        {(close) => (
          <form
            action={(fd) => start(() => composeEmail(fd).then(close).catch(() => {}))}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="studyId" value={studyId} />
            <input type="hidden" name="stageIndex" value={stageIndex} />
            <div>
              <label className="label" htmlFor="e-to">To</label>
              <input id="e-to" name="to" type="email" required className="input" placeholder="contact@client.com" />
            </div>
            <div>
              <label className="label" htmlFor="e-subject">Subject</label>
              <input id="e-subject" name="subject" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="e-body">Message</label>
              <textarea id="e-body" name="body" rows={6} className="input" />
            </div>
            <p className="text-[11px] text-muted">Replies route to your address. The sent message is logged to this thread.</p>
            <button type="submit" className="btn-primary mt-1" disabled={pending}>
              {pending ? "Sending…" : "Send email"}
            </button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
