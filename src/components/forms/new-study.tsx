"use client";

import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createStudy } from "@/actions/studies";

export function NewStudyButton({
  clients,
  presetClientId,
  label = "New study",
}: {
  clients: { id: string; name: string }[];
  presetClientId?: string;
  label?: string;
}) {
  return (
    <Dialog
      title="New study"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          <Plus size={16} /> {label}
        </button>
      )}
    >
      {() => (
        <form action={createStudy} className="flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="s-client">Client</label>
            <select
              id="s-client"
              name="clientId"
              required
              className="input"
              defaultValue={presetClientId ?? ""}
            >
              <option value="" disabled>Choose a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-name">Study name</label>
            <input id="s-name" name="name" required className="input" placeholder="Brand Tracker 2026" />
          </div>
          <div>
            <label className="label" htmlFor="s-type">Type</label>
            <input id="s-type" name="type" className="input" placeholder="Quantitative" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="s-start">Start date</label>
              <input id="s-start" name="startDate" type="date" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="s-end">Expected end</label>
              <input id="s-end" name="expectedEndDate" type="date" required className="input" />
            </div>
          </div>
          <p className="text-meta text-muted">Stage 0 (Intake) opens automatically with its gate items.</p>
          <button type="submit" className="btn-primary mt-1">Create study</button>
        </form>
      )}
    </Dialog>
  );
}
