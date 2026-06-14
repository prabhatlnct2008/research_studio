"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Send, ArrowRight } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { submitForReview, approveStage, sendBackStage, advanceStage } from "@/actions/stages";
import { STAGE_STATE_LABELS, type StageState } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";

export function ReviewStrip({
  studyId,
  stageIndex,
  state,
  reviewers,
  canWork,
  canReviewThis,
  canAdvance,
  isSubmitter,
  submitterName,
  reviewerName,
  reviewedAt,
  reviewNote,
  gateRemaining,
  isLastStage,
  isCurrent,
}: {
  studyId: string;
  stageIndex: number;
  state: StageState;
  reviewers: { id: string; name: string }[];
  canWork: boolean;
  canReviewThis: boolean;
  canAdvance: boolean;
  isSubmitter: boolean;
  submitterName: string | null;
  reviewerName: string | null;
  reviewedAt: number | null;
  reviewNote: string | null;
  gateRemaining: number;
  isLastStage: boolean;
  isCurrent: boolean;
}) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [showSendBack, setShowSendBack] = useState(false);

  const tone =
    state === "advanced" || state === "approved" ? "green" : state === "in_review" ? "amber" : state === "in_progress" ? "accent" : "neutral";

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-card-title font-semibold text-ink">Review &amp; advance</span>
        <Pill tone={tone}>{STAGE_STATE_LABELS[state]}</Pill>
      </div>

      {/* State detail line */}
      <p className="mb-3 text-meta text-muted">
        {state === "in_review" && (
          <>Submitted by {submitterName ?? "—"} · reviewer: {reviewerName ?? "—"}</>
        )}
        {state === "approved" && <>Approved by {reviewerName ?? "—"} · {fmtDateTime(reviewedAt)}</>}
        {state === "advanced" && <>Advanced · {fmtDateTime(reviewedAt)}</>}
        {state === "in_progress" && reviewNote && <>Sent back: {reviewNote}</>}
        {state === "in_progress" && !reviewNote && <>Work the stage, then submit for peer review.</>}
        {state === "not_started" && <>This stage hasn't started yet.</>}
      </p>

      {/* Controls */}
      {state === "in_progress" && (
        <div>
          {canWork ? (
            !showSubmit ? (
              <button className="btn-primary" onClick={() => setShowSubmit(true)}>
                <Send size={16} /> Submit for review
              </button>
            ) : (
              <form action={submitForReview} className="flex flex-col gap-3 rounded-[10px] bg-surface-2 p-3">
                <input type="hidden" name="studyId" value={studyId} />
                <input type="hidden" name="stageIndex" value={stageIndex} />
                <div>
                  <label className="label" htmlFor="reviewer">Reviewer (must be a different user)</label>
                  <select id="reviewer" name="reviewerId" required className="input" defaultValue="">
                    <option value="" disabled>Choose a reviewer…</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {reviewers.length === 0 && (
                    <p className="mt-1 text-[11px] text-red">No eligible reviewers — another user needs the review capability for this stage.</p>
                  )}
                </div>
                {gateRemaining > 0 && (
                  <p className="text-[11px] text-amber">Note: {gateRemaining} gate item(s) still open.</p>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary" disabled={reviewers.length === 0}>Submit</button>
                  <button type="button" className="btn-ghost" onClick={() => setShowSubmit(false)}>Cancel</button>
                </div>
              </form>
            )
          ) : (
            <p className="text-meta text-muted">You have read-only access to this stage.</p>
          )}
        </div>
      )}

      {state === "in_review" && (
        <div>
          {canReviewThis && !isSubmitter ? (
            !showSendBack ? (
              <div className="flex gap-2">
                <form action={approveStage}>
                  <input type="hidden" name="studyId" value={studyId} />
                  <input type="hidden" name="stageIndex" value={stageIndex} />
                  <button type="submit" className="btn-primary"><CheckCircle2 size={16} /> Approve</button>
                </form>
                <button className="btn-secondary" onClick={() => setShowSendBack(true)}>
                  <RotateCcw size={16} /> Send back
                </button>
              </div>
            ) : (
              <form action={sendBackStage} className="flex flex-col gap-3 rounded-[10px] bg-surface-2 p-3">
                <input type="hidden" name="studyId" value={studyId} />
                <input type="hidden" name="stageIndex" value={stageIndex} />
                <div>
                  <label className="label" htmlFor="note">Note to submitter</label>
                  <textarea id="note" name="note" rows={2} className="input" placeholder="What needs fixing?" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Send back</button>
                  <button type="button" className="btn-ghost" onClick={() => setShowSendBack(false)}>Cancel</button>
                </div>
              </form>
            )
          ) : (
            <p className="text-meta text-muted">
              {isSubmitter ? "Awaiting your reviewer's decision." : "Awaiting review by the assigned reviewer."}
            </p>
          )}
        </div>
      )}

      {(state === "approved" || state === "in_progress" || state === "in_review") && (
        <div className="mt-3 border-t border-border pt-3">
          <form action={advanceStage} className="inline-flex">
            <input type="hidden" name="studyId" value={studyId} />
            <input type="hidden" name="stageIndex" value={stageIndex} />
            <button
              type="submit"
              className="btn-primary"
              disabled={state !== "approved" || !canAdvance}
              title={
                state !== "approved"
                  ? "Advance is disabled until the stage is approved."
                  : !canAdvance
                    ? "You lack the advance capability for this stage."
                    : "Advance to the next stage"
              }
            >
              <ArrowRight size={16} /> {isLastStage ? "Complete final stage" : "Advance"}
            </button>
          </form>
          {state !== "approved" && (
            <p className="mt-1.5 text-[11px] text-muted">Advance unlocks once a reviewer approves this stage.</p>
          )}
        </div>
      )}

      {state === "advanced" && !isCurrent && (
        <p className="text-meta text-green">This stage has been advanced.</p>
      )}
    </div>
  );
}
