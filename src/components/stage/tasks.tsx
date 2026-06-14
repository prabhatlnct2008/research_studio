"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { createTask, updateTaskStatus } from "@/actions/tasks";
import { fmtDate, isOverdue } from "@/lib/format";

type Task = {
  id: string;
  title: string;
  status: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: number | null;
  isMine: boolean;
};

const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

export function TaskList({
  studyId,
  stageIndex,
  tasks,
  users,
  canAssign,
  meId,
}: {
  studyId: string;
  stageIndex: number;
  tasks: Task[];
  users: { id: string; name: string }[];
  canAssign: boolean;
  meId: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-card-title font-semibold text-ink">Tasks</h2>
        <NewTaskButton
          studyId={studyId}
          stageIndex={stageIndex}
          users={users}
          canAssign={canAssign}
          meId={meId}
        />
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-meta text-muted">
          No tasks in this stage yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const [pending, start] = useTransition();
  const overdue = task.status !== "done" && isOverdue(task.dueDate);

  return (
    <li
      className={[
        "flex items-center gap-3 rounded-card border bg-surface px-4 py-3",
        task.isMine ? "border-l-[3px] border-l-accent border-border" : "border-border",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-medium text-ink">{task.title}</span>
          {task.isMine && <span className="pill bg-accent-soft text-accent">Needs you</span>}
        </div>
        <div className="flex items-center gap-2 text-meta text-muted">
          <Avatar name={task.assigneeName ?? "?"} isMe={task.isMine} size={18} />
          <span>{task.assigneeName ?? "Unassigned"}</span>
          {task.dueDate && (
            <span className={`tnum ${overdue ? "text-red" : ""}`}>· {overdue ? "Overdue" : `Due ${fmtDate(task.dueDate)}`}</span>
          )}
        </div>
      </div>
      <select
        className="input w-auto py-1.5 text-meta"
        defaultValue={task.status}
        disabled={pending}
        onChange={(e) => {
          const fd = new FormData();
          fd.set("taskId", task.id);
          fd.set("status", e.target.value);
          start(() => {
            updateTaskStatus(fd);
          });
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </li>
  );
}

function NewTaskButton({
  studyId,
  stageIndex,
  users,
  canAssign,
  meId,
}: {
  studyId: string;
  stageIndex: number;
  users: { id: string; name: string }[];
  canAssign: boolean;
  meId: string;
}) {
  return (
    <Dialog
      title="New task"
      trigger={(open) => (
        <button className="btn-secondary text-meta" onClick={open}>
          <Plus size={15} /> New task
        </button>
      )}
    >
      {() => (
        <form action={createTask} className="flex flex-col gap-3">
          <input type="hidden" name="studyId" value={studyId} />
          <input type="hidden" name="stageIndex" value={stageIndex} />
          <div>
            <label className="label" htmlFor="t-title">Title</label>
            <input id="t-title" name="title" required className="input" placeholder="Draft the screener" />
          </div>
          <div>
            <label className="label" htmlFor="t-desc">Description</label>
            <textarea id="t-desc" name="description" rows={2} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="t-assignee">Assignee</label>
              {canAssign ? (
                <select id="t-assignee" name="assigneeId" className="input" defaultValue={meId}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <input className="input" value="Myself" disabled readOnly />
              )}
            </div>
            <div>
              <label className="label" htmlFor="t-due">Due date</label>
              <input id="t-due" name="dueDate" type="date" className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-1">Create task</button>
        </form>
      )}
    </Dialog>
  );
}
