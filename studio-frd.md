# Studio — Functional Requirements

**Tree edition · v1.0 · complete FRD with user stories & data management**
Companion docs: `studio-ui-spec.md` (UI), `studio-design-system.md` (visual), `studio-tree.html` (mock).

---

## 1. Purpose & scope

Studio is a delivery-management workspace for a small market-research team, organised as a navigable **tree** (Confluence/Jira style):

```
Workspace → Client → Study → Stage (×9, fixed) → { Emails · Notifications · Documents }
```

It manages the full journey of each study through nine fixed stages, with admin-defined roles, per-stage gate checklists, a maker-checker review before any stage advances, assignable tasks, a per-study kanban board, and a complete timestamped audit trail. **Analytics is out of scope for v1** (deferred).

Conventions: requirement IDs `FR-*`, user stories `US-*`. Acceptance criteria are testable. "Admin" = a user whose role holds the relevant admin capability; the built-in **Principal** role holds all capabilities.

---

## 2. Actors

| Actor | Description |
|---|---|
| **Principal (admin)** | Built-in superuser. Manages users, roles, clients, studies; can do anything. |
| **Team member** | Any active internal user; capabilities determined by their assigned role. |
| **Reviewer** | Any user whose role has the *review* capability for a stage. |
| **Client contact** | External; **never logs in**. Recipient of emails, source of approvals (recorded by a team member). |
| **System** | Generates notifications, stamps audit entries, computes "pending on you". |

---

## 3. Roles & permissions model

A **role** = a name + **stage scope** (which of the 9 stages it may act on) + **capability** flags. Capabilities:

`work_on_stage · advance_stage · review_stage · create_gates · create_tasks · assign_tasks · create_clients · create_studies · create_roles · manage_users`

(*`delete_stage` / workflow editing reserved for a future release — stages are fixed at 9 in v1.*)

Outside its stage scope a role is **read-only**. The Principal role is built-in, cannot be deleted, and always retains `manage_users` + `create_roles` (no lock-out). All authorization is enforced **server-side** on every operation.

---

## 4. Functional requirements & user stories

### 4.1 Authentication & onboarding

**FR-AUTH-1** Passwordless sign-in via emailed magic link. **FR-AUTH-2** Invite-only; no public sign-up. **FR-AUTH-3** Only `active` users can sign in; `invited` activate on first sign-in; `disabled` are refused.

- **US-AUTH-01** — *As a team member, I want to sign in with an email link so that I don't manage a password.*
  AC: entering a registered email sends a one-time link; following it within validity creates a session; an unregistered email reveals nothing about account existence.
- **US-AUTH-02** — *As an admin, I want only invited people to access the workspace.*
  AC: no self-registration route exists; a disabled user's link is rejected.

### 4.2 User & role management (admin)

**FR-USR-1** Admin can invite a user (name, email, role). **FR-USR-2** Admin can change a user's role and deactivate a user. **FR-USR-3** Users are never hard-deleted (audit integrity). **FR-USR-4** Admin can create/edit roles (stage scope + capabilities). **FR-USR-5** System prevents removing the last active Principal.

- **US-USR-01** — *As an admin, I want to invite a teammate and assign their role so they can start with the right access.*
  AC: invite creates a user with `status=invited` and sends a sign-in link; the assigned role's capabilities apply immediately on activation.
- **US-USR-02** — *As an admin, I want to create a custom role scoped to certain stages with specific capabilities.*
  AC: role editor accepts a name, a stage checklist, and capability toggles; saved role appears in the role list and is assignable; a user holding it can act only within scope.
- **US-USR-03** — *As an admin, I want to deactivate someone who has left without losing their history.*
  AC: deactivation blocks sign-in; the user's past activity, authored items, and assignments remain visible; their open tasks/reviews are surfaced for reassignment.
- **US-USR-04** — *As the system, I must never allow zero admins.*
  AC: any change that would leave no active Principal is rejected with a clear message.

### 4.3 Client management

**FR-CLI-1** Users with `create_clients` can create/edit clients (name, sector, location, status). **FR-CLI-2** A client has many contacts; one may be primary. **FR-CLI-3** Client status: `lead → active → dormant`.

- **US-CLI-01** — *As an authorised user, I want to create a client so studies can be filed under it.*
  AC: a created client appears at the top level of the tree; required field: name.
- **US-CLI-02** — *As an authorised user, I want to add contacts to a client so emails and approvals attribute to a person.*
  AC: contacts capture name + email; exactly zero or one primary per client.

### 4.4 Study management

**FR-STU-1** Users with `create_studies` can create a study under a client, capturing **name, start date, expected end date** (actual end on close). **FR-STU-2** A study has a single **lead**. **FR-STU-3** On creation the study starts at stage 0 (Intake), with gate items seeded from the gate template, and a stage instance opened. **FR-STU-4** Study status: `active → closed | lost`.

- **US-STU-01** — *As a study lead, I want to create a study with start and expected-end dates so timelines are explicit from the outset.*
  AC: form captures client, name, start date, expected end date; expected end must be ≥ start; study appears under its client; stage 0 is `in_progress`.
- **US-STU-02** — *As a study lead, I want to close a study when delivered.*
  AC: closing sets status and actual end date; closed studies remain readable in the tree (archived, not deleted).

### 4.5 Navigation (tree) & node overviews

**FR-NAV-1** A left tree renders Client → Study → Stage → Section, expand/collapse, instant. **FR-NAV-2** Each node is a page that overviews its subtree. **FR-NAV-3** Breadcrumb mirrors the path; every node has a shareable deep link.

- **US-NAV-01** — *As a team member, I want to expand the tree and land on any item so I can find work fast.*
  AC: expanding a node is instant (no reload); selecting a node opens its overview; breadcrumb updates.
- **US-NAV-02** — *As a team member, I want each level to summarise what's beneath it so I'm never lost.*
  AC: client page lists its studies; study page lists its stages with counts; stage page shows section counts + gate + tasks.

### 4.6 Stages & gate checklists

**FR-STG-1** Nine fixed stages: Intake, Plan & budget, Proposal, Sign-off, Setup, Recruitment, Analysis, Report, Wrap-up. **FR-STG-2** Each stage has a **flat gate checklist** instantiated from an admin-managed **gate template** for that stage. **FR-GAT-1** Users with `create_gates` edit the template (add/edit/remove items per stage); template edits apply to **future** studies only. **FR-GAT-2** Within a study, users with `work_on_stage` (in scope) toggle gate items `open → wip → done`; each toggle records actor + timestamp.

- **US-GAT-01** — *As an admin, I want to define each stage's gate items so every study follows our methodology.*
  AC: per-stage template editor lists items; saved items seed new studies; existing in-flight studies are unaffected.
- **US-GAT-02** — *As a researcher, I want to tick off gate items as I complete them so the team sees what's left.*
  AC: toggling an item is restricted to in-scope users; the item shows who completed it and when; the stage shows `n/total` done.

### 4.7 Stage review & advancement (maker-checker)

**FR-REV-1** A stage instance has states: `not_started → in_progress → in_review → approved → advanced`. **FR-REV-2** A worker **submits for review** and assigns a **reviewer who must be a different user** holding `review_stage`. **FR-REV-3** Reviewer **approves** or **sends back** (with note → `in_progress`). **FR-REV-4** Only after `approved` can a user with `advance_stage` advance; advancing opens the next stage and seeds its gate items. **FR-REV-5** Every transition records actor + date/time.

- **US-REV-01** — *As a researcher, I want to submit a finished stage for review so a colleague checks it before we move on.*
  AC: submit requires choosing a reviewer ≠ self with the review capability; state → `in_review`; the reviewer is notified and the item appears in their "For you" list.
- **US-REV-02** — *As a reviewer, I want to approve or send back a stage with a note so quality is controlled.*
  AC: approve → `approved`; send-back → `in_progress` with the note recorded and the submitter notified.
- **US-REV-03** — *As a lead, I want to advance a stage only after approval so nothing skips review.*
  AC: the Advance control is disabled until `approved`; a tooltip states what's outstanding; advancing is restricted to `advance_stage` holders and is timestamped.

### 4.8 Emails (per stage)

**FR-EML-1** Emails attach **to a stage**, grouped into **threads**. **FR-EML-2** Capture by (a) uploading `.eml`/`.msg`, parsed into a thread, or (b) forwarding to a per-stage address (future). **FR-EML-3** Outbound send via the mail provider, with `reply_to` set to the acting user; sent mail is logged as an outbound thread message. **FR-EML-4** Raw email files are stored as documents (blob); parsed metadata + body are queryable.

- **US-EML-01** — *As a researcher, I want to import an email into the right stage so the record is complete without forwarding noise.*
  AC: uploading `.eml`/`.msg` creates/updates a thread under that stage with sender, recipients, subject, body, timestamp; the file is retained.
- **US-EML-02** — *As a study lead, I want to send a client email from the stage and have it logged.*
  AC: composed mail sends via the provider; an outbound message is recorded in the thread with status and timestamp; failures are surfaced and recorded.

### 4.9 Documents (per stage)

**FR-DOC-1** Users with stage scope upload documents to a stage (any type). **FR-DOC-2** Files stored in blob; metadata (name, type, size, uploader, date) queryable. **FR-DOC-3** Download via signed/managed URL. **FR-DOC-4** Delete removes both blob and metadata (capability-gated) and is logged.

- **US-DOC-01** — *As a researcher, I want to upload deliverables to a stage so everything for that phase is in one place.*
  AC: upload accepts large files; the document lists with type/size/date/uploader; it appears under that stage's Documents.

### 4.10 Notifications (per stage / per user)

**FR-NOT-1** System generates notifications on key events (task assigned, stage submitted/approved/sent-back, gate alert). **FR-NOT-2** Notifications may target a user (drives "For you") or be stage-scoped (informational). **FR-NOT-3** Read state is per user.

- **US-NOT-01** — *As a team member, I want to be notified when something needs me so I don't miss it.*
  AC: assignment, review request, and send-back generate a targeted notification to the right user; it appears in their bell + "For you".

### 4.11 Tasks / issues

**FR-TSK-1** Any user can create a task **for themselves**; users with `assign_tasks` can assign to others. **FR-TSK-2** A task has title, description, assignee, reporter, due date, the study + stage it belongs to, and status `todo → in_progress → in_review → done`. **FR-TSK-3** Tasks appear as kanban cards (in their stage column), in the stage's Tasks list, in the assignee's "For you", and trigger a notification on assignment. **FR-TSK-4** Tasks are distinct from gate items (work vs advancement conditions).

- **US-TSK-01** — *As a team member, I want to create tasks for myself so I can track my own work.*
  AC: self-created task requires title + stage; defaults assignee = self, status = todo.
- **US-TSK-02** — *As an admin/lead, I want to assign tasks to teammates so work is distributed clearly.*
  AC: `assign_tasks` holders set any active user as assignee; assignee is notified; task shows in their "For you" and on the board.

### 4.12 Study board (kanban)

**FR-KAN-1** Each study offers a board view, toggled from the study overview. **FR-KAN-2** **Columns = the 9 fixed stages**, in order; the live stage is highlighted; phase bands (Win/Deliver/Close) group columns. **FR-KAN-3** **Cards = open tasks/issues** in each stage (a quick view of outstanding work per stage); each card shows title, assignee, due, status dot. **FR-KAN-4** Moving a card changes the task's stage, subject to the mover's stage scope. **FR-KAN-5** Each column header shows the stage's review state and open-task count.

- **US-KAN-01** — *As a study lead, I want a board of the study by stage showing open issues so I can see outstanding work at a glance.*
  AC: board renders 9 stage columns; each lists that stage's open tasks; the current stage is marked; column header shows open count + review state.
- **US-KAN-02** — *As a researcher, I want to drag a task to another stage so the board reflects reality.*
  AC: drag is allowed only for stages in the mover's scope; the move is recorded with actor + time.

### 4.13 "Pending on you"

**FR-PND-1** An item is **pending on a user** if: they own a study's next action; a task is assigned to them and open; a stage awaits their review; or a notification targeted to them is unread. **FR-PND-2** Surfaced four ways: a pinned **For-you list** (flat, cross-tree); **petrol badges propagating up** tree branches; **in-page "Needs you"** marking; a **bell** count. **FR-PND-3** "Pending on you" (petrol) is visually distinct from general activity (muted) and risk (rose).

- **US-PND-01** — *As a team member, I want one place that shows everything waiting on me so I know where to start.*
  AC: For-you list aggregates my open tasks, review requests, owned next actions, and unread targeted notifications; selecting one jumps to it (tree auto-expands).
- **US-PND-02** — *As a team member, I want collapsed branches to show if they hold work for me.*
  AC: a pending item inside a stage badges its Stage → Study → Client with a petrol count.

### 4.14 Activity log & audit (timestamps)

**FR-AUD-1** Every state-changing action appends an **append-only** activity entry: actor, type, summary, target, **date + time**. **FR-AUD-2** Timestamps are visible inline on items and in node activity feeds (not hover-only). **FR-AUD-3** Audit entries are never edited or deleted.

- **US-AUD-01** — *As an admin, I want a complete record of who did what and when so the work is auditable.*
  AC: completing gate items, submitting/approving/advancing stages, uploading/sending email, and creating/moving tasks each produce a timestamped entry attributed to the actor.

### 4.15 Search

**FR-SCH-1** Tree search jumps to any client, study, stage, document, or task by name.
- **US-SCH-01** — *As a team member, I want to search the tree so I reach an item without manual expanding.* AC: matches surface across node types; selecting expands the path.

---

## 5. Data management

### 5.1 Entities (functional model)

| Entity | Key attributes | Lifecycle / states |
|---|---|---|
| **User** | name, email (unique), role, status, invited_by, created_at | invited → active → disabled (soft-delete only) |
| **Role** | name, stage_scope[], capabilities{}, is_builtin | created → edited; Principal protected |
| **Client** | name, sector, location, status, owner | lead → active → dormant |
| **Contact** | client, name, email, is_primary | — |
| **Study** | client, name, type, lead, start_date, expected_end_date, actual_end_date, current_stage, status | active → closed \| lost (archived, not deleted) |
| **StageInstance** | study, stage_index (0–8), state, entered_at, submitted_by/at, reviewer, reviewed_at, advanced_by/at, review_note | not_started → in_progress → in_review → approved → advanced |
| **GateTemplateItem** | stage_index, label, order | admin-managed; seeds future studies |
| **GateItem** | study, stage_index, label, status, done_by, done_at | open → wip → done |
| **Email** | study, stage_index, thread_id, direction, from, to, subject, body, occurred_at, source, raw_file_ref, message_id | logged \| sent \| failed |
| **Document** | study, stage_index, name, file_type, file_ref(blob), size, uploaded_by, uploaded_at | active → deleted (blob + row) |
| **Notification** | study, stage_index, kind, text, target_user?, created_at, read_by/at | unread → read |
| **Task** | study, stage_index, title, description, assignee, reporter, due_date, status, created_at, updated_at | todo → in_progress → in_review → done |
| **ActivityLog** | study, actor, type, summary, target_ref, created_at | append-only (immutable) |

Hierarchy is expressed by foreign keys (Client→Study→Stage artifacts); the "tree" is rendered from these relationships.

### 5.2 CRUD & ownership

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| User | `manage_users` | admin | `manage_users` | deactivate only |
| Role | `create_roles` | admin | `create_roles` | non-builtin only |
| Client | `create_clients` | all | `create_clients` | archive (status) |
| Study | `create_studies` | all | lead / admin | archive (close) |
| GateTemplate | `create_gates` | admin | `create_gates` | `create_gates` |
| GateItem | system (seed) | in-scope | in-scope `work_on_stage` | n/a |
| Stage transition | per §4.7 capabilities | all | n/a | n/a |
| Email | in-scope | in-scope | n/a | `work_on_stage` |
| Document | in-scope | in-scope | n/a | in-scope |
| Task | self / `assign_tasks` | all | assignee/reporter/admin | reporter/admin |
| Notification | system | target user | mark read (self) | n/a |
| ActivityLog | system | all | never | never |

### 5.3 Validation rules

- Email format valid; user email unique. Expected end date ≥ start date.
- Reviewer ≠ submitter, and reviewer must hold `review_stage`.
- Advance blocked unless stage `approved` and actor holds `advance_stage`.
- Gate/stage edits restricted to the actor's stage scope.
- Role change cannot leave zero active Principals.
- Required fields: client name; study name + start + expected end; task title + stage; role name.

### 5.4 Integrity, retention & deletion

- **People are never hard-deleted** — disabled, preserving authored items and audit attribution.
- **Studies are archived** (closed/lost), never destroyed; remain fully readable.
- **Documents** delete removes both the blob and its metadata, logged.
- **Audit log is immutable** — no edit/delete path exists; retained indefinitely.
- **Cascade**: deleting a study (admin-only, rare) would cascade its stage artifacts and blobs; default is archive, not delete.
- **Files** live in blob storage (documents + raw emails); only references + metadata are stored relationally.

### 5.5 Import / export

- **Import**: email `.eml`/`.msg` into a stage (§4.8); document upload (§4.9).
- **Export** (v1, light): a study's documents and a CSV of its activity log are exportable for handover/audit. (Full data export deferred.)

---

## 6. Non-functional requirements

- **Feel** — navigation is instant (client-side tree, prefetch, optimistic updates); no spinners on expand/select.
- **Security** — all authorization enforced server-side per role capability + stage scope; passwordless auth; least privilege.
- **Auditability** — every state change is attributable and timestamped; logs immutable.
- **Accessibility** — keyboard navigable, visible focus, status never by colour alone, reduced-motion respected.
- **Scale** — sized for a small team (single-digit clients, small concurrent studies); no premature caching.

---

## 7. Out of scope (v1) / future

Analytics & reporting dashboard · custom/editable workflow (add/remove/reorder stages — stages fixed at 9 now) · per-stage email forwarding address · Redis caching · full data export · client/vendor logins · financial tracking · multi-org tenancy.

---

## 8. Assumptions & open items

- Single organisation/team (no multi-tenancy).
- Stage set fixed at 9; gate **content** is admin-editable, stage **structure** is not (v1).
- "Next action" per study is represented as an open task/owned item feeding "pending on you".
- A release valve for review (admin solo approve-and-advance, logged as override) is **proposed** but not yet confirmed — decide before build.
