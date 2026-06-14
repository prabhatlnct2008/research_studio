"use client";

import { Plus, Trash2 } from "lucide-react";
import { addTemplateItem, deleteTemplateItem, updateTemplateItem } from "@/actions/gates";
import { STAGES } from "@/lib/constants";

type Item = { id: string; stageIndex: number; label: string; order: number };

export function GatesAdmin({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="mb-2 text-meta text-muted">
        Editing a stage's gate template changes which items new studies are seeded with. Studies already in flight are unaffected.
      </p>
      {STAGES.map((name, i) => {
        const stageItems = items.filter((it) => it.stageIndex === i).sort((a, b) => a.order - b.order);
        return (
          <div key={i} className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="tnum text-meta font-semibold text-faint">{i}</span>
              <span className="text-card-title font-semibold text-ink">{name}</span>
              <span className="ml-auto text-meta text-muted">{stageItems.length} items</span>
            </div>
            <ul className="divide-y divide-border">
              {stageItems.map((it) => (
                <li key={it.id} className="flex items-center gap-2 px-4 py-2">
                  <form action={updateTemplateItem} className="flex-1">
                    <input type="hidden" name="id" value={it.id} />
                    <input
                      name="label"
                      defaultValue={it.label}
                      className="w-full bg-transparent text-body text-ink outline-none focus:rounded-[6px] focus:bg-surface-2 focus:px-2 focus:py-1"
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== it.label) e.target.form?.requestSubmit();
                      }}
                    />
                  </form>
                  <form action={deleteTemplateItem}>
                    <input type="hidden" name="id" value={it.id} />
                    <button className="btn-ghost px-1.5 text-muted hover:text-red" title="Remove item">
                      <Trash2 size={15} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addTemplateItem} className="flex items-center gap-2 border-t border-border px-4 py-2.5">
              <input type="hidden" name="stageIndex" value={i} />
              <input name="label" required placeholder="Add a gate item…" className="input flex-1 py-1.5 text-meta" />
              <button className="btn-secondary text-meta"><Plus size={15} /> Add</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
