"use client";

import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Pill } from "@/components/ui/pill";
import { createRole, updateRole, deleteRole } from "@/actions/roles";
import { CAPABILITIES, CAPABILITY_LABELS, STAGES, type Capability } from "@/lib/constants";

type Role = {
  id: string;
  name: string;
  stageScope: number[];
  capabilities: Record<string, boolean>;
  isBuiltin: boolean;
  userCount: number;
};

export function RolesAdmin({ roles }: { roles: Role[] }) {
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <RoleDialog mode="create" />
      </div>
      <div className="flex flex-col gap-2">
        {roles.map((r) => {
          const caps = CAPABILITIES.filter((c) => r.isBuiltin || r.capabilities?.[c]);
          return (
            <div key={r.id} className="rounded-card border border-border bg-surface px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Shield size={18} className="shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-ink">{r.name}</span>
                    {r.isBuiltin && <Pill tone="accent">Built-in</Pill>}
                  </div>
                  <p className="text-meta text-muted">
                    {r.userCount} {r.userCount === 1 ? "user" : "users"} ·{" "}
                    {r.isBuiltin ? "all stages" : `${r.stageScope.length}/${STAGES.length} stages`}
                  </p>
                </div>
                <RoleDialog mode="edit" role={r} />
                {!r.isBuiltin && (
                  <form action={deleteRole}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-ghost px-2 text-muted hover:text-red" title="Delete role">
                      <Trash2 size={16} />
                    </button>
                  </form>
                )}
              </div>
              {caps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
                  {caps.map((c) => (
                    <span key={c} className="pill bg-surface-2 text-muted">{CAPABILITY_LABELS[c as Capability]}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleDialog({ mode, role }: { mode: "create" | "edit"; role?: Role }) {
  const action = mode === "create" ? createRole : updateRole;
  return (
    <Dialog
      title={mode === "create" ? "New role" : `Edit ${role?.name}`}
      trigger={(open) =>
        mode === "create" ? (
          <button className="btn-primary" onClick={open}>
            <Plus size={16} /> New role
          </button>
        ) : (
          <button className="btn-ghost px-2" onClick={open} title="Edit role">
            <Pencil size={16} />
          </button>
        )
      }
    >
      {(close) => (
        <form action={(fd) => { action(fd); close(); }} className="flex flex-col gap-4">
          {role && <input type="hidden" name="id" value={role.id} />}
          <div>
            <label className="label" htmlFor="r-name">Role name</label>
            <input id="r-name" name="name" required className="input" defaultValue={role?.name ?? ""} placeholder="Field Manager" />
          </div>

          <div>
            <p className="label">Stage scope</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STAGES.map((s, i) => (
                <label key={i} className="flex items-center gap-2 text-meta text-ink">
                  <input
                    type="checkbox"
                    name={`stage_${i}`}
                    defaultChecked={role?.isBuiltin || role?.stageScope?.includes(i)}
                    className="h-4 w-4 accent-[#0E8A7C]"
                  />
                  <span className="truncate">{i}. {s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Capabilities</p>
            <div className="grid grid-cols-1 gap-1.5">
              {CAPABILITIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-meta text-ink">
                  <input
                    type="checkbox"
                    name={`cap_${c}`}
                    defaultChecked={role?.isBuiltin || role?.capabilities?.[c]}
                    className="h-4 w-4 accent-[#0E8A7C]"
                  />
                  {CAPABILITY_LABELS[c]}
                </label>
              ))}
            </div>
          </div>

          {role?.isBuiltin && (
            <p className="text-[11px] text-muted">The Principal role always keeps full access — your changes won't lock it out.</p>
          )}
          <button type="submit" className="btn-primary">{mode === "create" ? "Create role" : "Save changes"}</button>
        </form>
      )}
    </Dialog>
  );
}
