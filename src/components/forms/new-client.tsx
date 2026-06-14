"use client";

import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/actions/clients";

export function NewClientButton() {
  return (
    <Dialog
      title="New client"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          <Plus size={16} /> New client
        </button>
      )}
    >
      {() => (
        <form action={createClient} className="flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="c-name">Name</label>
            <input id="c-name" name="name" required className="input" placeholder="Acme Corp" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="c-sector">Sector</label>
              <input id="c-sector" name="sector" className="input" placeholder="FMCG" />
            </div>
            <div>
              <label className="label" htmlFor="c-location">Location</label>
              <input id="c-location" name="location" className="input" placeholder="London, UK" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-status">Status</label>
            <select id="c-status" name="status" className="input" defaultValue="active">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
          <button type="submit" className="btn-primary mt-1">Create client</button>
        </form>
      )}
    </Dialog>
  );
}
