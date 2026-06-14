import { Check, Circle, CircleDot } from "lucide-react";
import { toggleGateItem } from "@/actions/stages";
import { fmtDateTime } from "@/lib/format";

type Item = {
  id: string;
  label: string;
  status: "open" | "wip" | "done";
  doneAt: Date | null;
  doneByName: string | null;
};

export function GateChecklist({ items, canWork }: { items: Item[]; canWork: boolean }) {
  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-card-title font-semibold text-ink">Gate checklist</span>
        <span className="tnum text-meta text-muted">{done}/{items.length} done</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-meta text-muted">No gate items for this stage.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
              <form action={toggleGateItem}>
                <input type="hidden" name="itemId" value={it.id} />
                <button
                  type="submit"
                  disabled={!canWork}
                  className="flex h-5 w-5 items-center justify-center disabled:cursor-not-allowed"
                  aria-label={`Toggle ${it.label}`}
                  title={canWork ? "Toggle status" : "Read-only"}
                >
                  {it.status === "done" ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-bg text-green">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  ) : it.status === "wip" ? (
                    <CircleDot size={18} className="text-amber" />
                  ) : (
                    <Circle size={18} className="text-faint" />
                  )}
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <span className={["text-body", it.status === "done" ? "text-muted line-through" : "text-ink"].join(" ")}>
                  {it.label}
                </span>
                {it.status === "done" && it.doneByName && (
                  <span className="block text-[11px] text-muted">
                    by {it.doneByName} · {fmtDateTime(it.doneAt)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
