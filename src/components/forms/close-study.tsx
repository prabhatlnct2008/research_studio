"use client";

import { Dialog } from "@/components/ui/dialog";
import { closeStudy } from "@/actions/studies";

export function CloseStudyButton({ studyId }: { studyId: string }) {
  return (
    <Dialog
      title="Close study"
      trigger={(open) => (
        <button className="btn-secondary text-meta" onClick={open}>
          Close study
        </button>
      )}
    >
      {() => (
        <form action={closeStudy} className="flex flex-col gap-3">
          <input type="hidden" name="studyId" value={studyId} />
          <p className="text-meta text-muted">
            Closing archives the study — it stays fully readable in the tree, never deleted.
          </p>
          <div>
            <label className="label" htmlFor="cs-outcome">Outcome</label>
            <select id="cs-outcome" name="outcome" className="input" defaultValue="closed">
              <option value="closed">Closed (delivered)</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <button type="submit" className="btn-primary mt-1">Confirm</button>
        </form>
      )}
    </Dialog>
  );
}
