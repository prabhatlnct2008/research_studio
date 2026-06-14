"use client";

import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { addContact } from "@/actions/clients";

export function AddContactButton({ clientId }: { clientId: string }) {
  return (
    <Dialog
      title="Add contact"
      trigger={(open) => (
        <button className="btn-secondary text-meta" onClick={open}>
          <Plus size={15} /> Add contact
        </button>
      )}
    >
      {() => (
        <form action={addContact} className="flex flex-col gap-3">
          <input type="hidden" name="clientId" value={clientId} />
          <div>
            <label className="label" htmlFor="ct-name">Name</label>
            <input id="ct-name" name="name" required className="input" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="label" htmlFor="ct-email">Email</label>
            <input id="ct-email" name="email" type="email" required className="input" placeholder="jane@client.com" />
          </div>
          <label className="flex items-center gap-2 text-meta text-ink">
            <input type="checkbox" name="isPrimary" className="h-4 w-4 accent-[#0E8A7C]" />
            Primary contact
          </label>
          <button type="submit" className="btn-primary mt-1">Add contact</button>
        </form>
      )}
    </Dialog>
  );
}
