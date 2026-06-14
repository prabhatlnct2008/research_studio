"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy, KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Pill } from "@/components/ui/pill";
import { Avatar } from "@/components/ui/avatar";
import {
  inviteUser,
  resetUserPassword,
  changeUserRole,
  setUserStatus,
  type InviteResult,
} from "@/actions/users";

type Row = {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  status: string;
  isMe: boolean;
};

export function UsersAdmin({
  users,
  roles,
}: {
  users: Row[];
  roles: { id: string; name: string }[];
}) {
  const [credential, setCredential] = useState<{ email: string; pw: string } | null>(null);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <InviteDialog roles={roles} onIssued={(email, pw) => setCredential({ email, pw })} />
      </div>

      {credential && (
        <CredentialBanner email={credential.email} pw={credential.pw} onClose={() => setCredential(null)} />
      )}

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} roles={roles} onReset={(email, pw) => setCredential({ email, pw })} />
        ))}
      </div>
    </div>
  );
}

function CredentialBanner({ email, pw, onClose }: { email: string; pw: string; onClose: () => void }) {
  return (
    <div className="mb-6 rounded-card border border-accent/30 bg-accent-soft/50 p-4">
      <p className="mb-1 text-meta font-medium text-ink">Temporary password issued</p>
      <p className="text-meta text-muted">
        Share with <span className="text-ink">{email}</span>. They'll be asked to change it on first sign-in.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded-[8px] bg-surface px-3 py-1.5 text-body font-semibold text-ink">{pw}</code>
        <button className="btn-ghost px-2" onClick={() => navigator.clipboard?.writeText(pw)} title="Copy">
          <Copy size={15} />
        </button>
        <button className="btn-ghost ml-auto text-meta" onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

function InviteDialog({
  roles,
  onIssued,
}: {
  roles: { id: string; name: string }[];
  onIssued: (email: string, pw: string) => void;
}) {
  const [result, action] = useActionState<InviteResult | undefined, FormData>(inviteUser, undefined);

  // Surface the issued credential to the parent when the action succeeds.
  if (result?.ok) {
    // defer to avoid setState during render
    queueMicrotask(() => onIssued(result.email, result.tempPassword));
  }

  return (
    <Dialog
      title="Add user"
      trigger={(open) => (
        <button className="btn-primary" onClick={open}>
          <Plus size={16} /> Add user
        </button>
      )}
    >
      {(close) => (
        <form
          action={(fd) => {
            action(fd);
            close();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="label" htmlFor="u-name">Name</label>
            <input id="u-name" name="name" required className="input" placeholder="Priya R." />
          </div>
          <div>
            <label className="label" htmlFor="u-email">Email</label>
            <input id="u-email" name="email" type="email" required className="input" placeholder="priya@studio.local" />
          </div>
          <div>
            <label className="label" htmlFor="u-role">Role</label>
            <select id="u-role" name="roleId" className="input" defaultValue="">
              <option value="">No role (read-only)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-muted">A temporary password is generated for you to share.</p>
          <button type="submit" className="btn-primary mt-1">Add user</button>
        </form>
      )}
    </Dialog>
  );
}

function UserRow({
  user,
  roles,
  onReset,
}: {
  user: Row;
  roles: { id: string; name: string }[];
  onReset: (email: string, pw: string) => void;
}) {
  const [pending, start] = useTransition();
  const [resetResult, resetAction] = useActionState<InviteResult | undefined, FormData>(resetUserPassword, undefined);

  if (resetResult?.ok) {
    queueMicrotask(() => onReset(resetResult.email, resetResult.tempPassword));
  }

  const statusTone = user.status === "active" ? "green" : user.status === "invited" ? "accent" : "neutral";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
      <Avatar name={user.name} isMe={user.isMe} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-ink">
          {user.name} {user.isMe && <span className="text-meta text-muted">(you)</span>}
        </p>
        <p className="truncate text-meta text-muted">{user.email}</p>
      </div>
      <Pill tone={statusTone}>{user.status}</Pill>

      <select
        className="input w-auto py-1.5 text-meta"
        defaultValue={user.roleId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const fd = new FormData();
          fd.set("userId", user.id);
          fd.set("roleId", e.target.value);
          start(() => changeUserRole(fd));
        }}
      >
        <option value="">No role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <form action={resetAction}>
        <input type="hidden" name="userId" value={user.id} />
        <button className="btn-ghost px-2" title="Issue temp password">
          <KeyRound size={16} />
        </button>
      </form>

      <form
        action={(fd) => start(() => setUserStatus(fd))}
      >
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="status" value={user.status === "disabled" ? "active" : "disabled"} />
        <button
          className="btn-ghost px-2"
          title={user.status === "disabled" ? "Re-activate" : "Disable"}
          disabled={user.isMe}
        >
          {user.status === "disabled" ? <UserCheck size={16} /> : <UserX size={16} className="text-muted hover:text-red" />}
        </button>
      </form>
    </div>
  );
}
