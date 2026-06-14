# Studio — UI Spec (mock)

**UI only.** No data model, no backend. Visual reference: `studio-tree.html`. Tokens: `studio-design-system.md` (petrol/paper, Space Grotesk + Inter).

---

## 1. Layout

Two panes, full height, no page scroll on the shell.

```
┌──────────────┬─────────────────────────────────────┐
│  TREE PANE   │  Breadcrumb bar                      │
│  (300px)     ├─────────────────────────────────────┤
│              │  Node page (scrolls), max-width 920  │
└──────────────┴─────────────────────────────────────┘
```

- **Tree pane** (left, fixed 300px): logo, search, the **For-you list**, then the client tree.
- **Main**: a breadcrumb bar (fixed) over a scrolling content area.
- Collapses to a single column under ~780px (tree becomes a drawer).

---

## 2. Tree pane

### 2.1 Tree
- Nodes nest: **Client → Study → Stage (×9) → {Emails, Notifications, Documents}**.
- Each row: chevron (if it has children) · type icon · name · a right-side marker.
- **Right-side marker** per type: Study → risk dot (green/amber/rose). Stage → state dot (done green / current petrol / future slate). Section → item count.
- Expand/collapse is instant; chevron rotates 90°. Active node = petrol-tint background.
- Indentation steps ~15px per level.
- **Search** box at top filters/jumps to any node by name.

### 2.2 Pending badges (propagate up)
- Any node whose subtree contains something **pending on the current user** shows a small **petrol count badge** on the right of its row.
- The badge **bubbles upward**: a pending email in Recruitment puts a badge on Emails → Stage → Study → Client. Collapsed branches still reveal where your work lives.
- Badge number = count of *your* pending items in that subtree. Petrol = yours; never use the risk colours for this (risk ≠ "assigned to you").

### 2.3 "For you" list (pinned, top of tree)
- A flat, cross-hierarchy list above the clients: **everything waiting on the current user**, most-urgent first.
- Each row: short label (what's needed) · which study/stage it's in · a due/idle hint. Click → jumps to that node (tree auto-expands the path).
- Header shows a count. This is the default landing surface — open the app, see what's on you.

---

## 3. Breadcrumb
- Mirrors the active node's path: `Workspace / Client / Study / Stage / Section`.
- Every crumb is clickable; "Workspace" → all-clients home. Current crumb is bold/ink, the rest muted.

---

## 4. Node pages

**One rule: every node page is an overview of everything beneath it.** Header = node type eyebrow + title + a status pill + (optionally) a primary action.

- **Workspace (home)** — list of clients, each with a "on track / N at risk" marker. Entry point.
- **Client** — summary tiles (studies / at risk / to watch); list of its studies (→ study page); a "what's happening" feed (each study's next action).
- **Study** — a **view toggle** (Overview · Board). *Overview:* current stage + risk pill; the **next-action banner**; start / expected-end dates; counts of emails/docs/notifications/open tasks; a list of all stages (state + per-stage email/doc counts), each → stage page. *Board:* the study's kanban (§13). Created via a **New study** form capturing client, name, start date, expected end date.
- **Stage** — three **section cards** (Emails, Notifications, Documents) with counts → section pages; the stage **gate** checklist (flat); a **Tasks** list for this stage; and the **review & advance** control strip (§12): Submit for review → Approve → Advance.
- **Emails (section)** — list of **threads**; click a thread to expand the chain (each message: sender, sent/received tag, time, body). Primary action: *Import / attach email*.
- **Documents (section)** — file rows (name, type, size, date) with download; primary action: *Upload*.
- **Notifications (section)** — a feed of stage events/alerts.

---

## 5. "Pending on you" — the full mechanism (UI)

An item reads as *pending on you* when you're the owner of the next action, a gate item assigned to you is open, or an email/notification needs your reply. Surfaced in **four** places so it can't be missed:

1. **For-you list** (§2.3) — the flat cross-tree inbox. Primary.
2. **Tree badges** (§2.2) — petrol counts bubbling up the branches, for in-context awareness.
3. **In-page marking** — on any node page, rows that are yours get a **"Needs you"** tag and a petrol left-edge accent; your avatar is shown filled, teammates' muted.
4. **Top-bar bell** — a single count in the breadcrumb bar; click opens the same For-you list.

**Visual rule:** *yours* = petrol accent; *general unread/activity* = muted/neutral; *risk* = rose. Three different meanings, three different colours — never conflate "at risk" with "assigned to me."

---

## 6. Components (visual contract)

- **Button** — primary (petrol, white text), secondary (white, border), ghost (text only). One primary per region; label is the verb that happens.
- **Status pill** — rounded, 11px/600. Track = green, Watch = amber, Risk = rose, Neutral = grey. Risk pills always sit beside a reason in words, never alone.
- **Avatar** — round, petrol, white initials; filled when it's you, muted when a teammate.
- **Tile** — stat card with a 3px coloured left bar, big Space-Grotesk number, muted label. Top-of-page summaries only.
- **List item / row** — icon · title (bold) · meta (muted) · right marker; whole row clickable, hover well, ≥56px tall.
- **Section card** (stage page) — icon chip + count + label + one-line state; hover lift.
- **Gate checklist** — rows with a check box state: done (green ✓), in-progress (amber •), open (empty).
- **Email thread** — collapsible header (subject + msg count + chevron); expanded shows stacked messages with sent/received tags.
- **Feed line** — coloured dot + text + right-aligned time; dot colour by kind (move green / mail petrol / alert amber).
- **Empty state** — a dashed panel naming what to do next, with the primary action.

---

## 7. States

- **Navigation** — instant; the tree stays in memory, no spinners on expand or node switch. A subtle ~120ms content fade only.
- **Hover** — rows/cards get a surface-2 well or a 1px lift + soft shadow.
- **Active** — current tree node carries the petrol-tint background; current crumb is bold.
- **Pending-on-you** — petrol badge (tree) + "Needs you" tag + petrol edge (in page).
- **Empty / loading** — empty = instructional panel; loading should be near-invisible at this scale.

---

## 8. Motion
Minimal and functional. Chevron rotate + content fade ~120ms; tree drawer (mobile) ~220ms. No entrance animations, no decorative motion. Respect reduced-motion.

---

## 9. Visual language (reference)
Cool-paper background, white surfaces, ink text, **petrol** as the single accent; status palette green/amber/rose; **Space Grotesk** for titles & numbers, **Inter** for everything else; 12–14px radius; flat by default, shadow only on hover/overlay. Full tokens in `studio-design-system.md`.

---

## 10. Admin — Roles & permissions

A **Roles** screen (admin only). Each role is defined by a **name**, the **stages it may act on**, and a set of **capability** toggles:

- *Stage scope* — a checklist of stages this role can **work on** (edit content, complete gate items, upload, log/send email, change tasks). Outside its scope, the role is read-only.
- *Capabilities* — independent toggles: **advance a stage · review/approve a stage · delete/edit a stage (workflow) · create gates · create & assign tasks · create clients · create studies · create roles · create & manage users.**

UI: a **role editor** (name field + two checklist columns: stages | capabilities) and a **roles list**. A built-in **Principal** role has everything and cannot be deleted or stripped of "manage users / create roles" (no lock-out). Show, per role, a count of users who hold it.

## 11. Admin — Users

A **Users** screen (admin only): invite by email, assign a role from the roles list, change a user's role later, deactivate (never delete — preserves the audit trail). Each row shows name, email, role, status (invited / active / disabled). Inviting sends a sign-in link; no passwords.

## 12. Stage review & advancement (maker-checker)

Every stage passes a peer review before it can advance. The stage page carries a **control strip** reflecting its state:

1. **In progress** — work the stage; complete gate items and tasks.
2. **Submit for review** — the worker submits and assigns a **reviewer** (must be a *different* user, holding the *review* capability). Stage state → *In review*.
3. **Approve / Send back** — the reviewer approves (state → *Approved*) or sends back with a note (→ *In progress*).
4. **Advance** — only after approval, a user with the *advance* capability moves the stage forward; the next stage opens.

Every transition records **who and when** (date + time), shown inline on the strip and in the activity feed. The "Advance" button is disabled until *Approved*; a tooltip says what's outstanding (gate items, review).

## 13. Study board (kanban)

A per-study board, toggled from the study Overview.

- **Columns = the study's stages** (left→right in workflow order; the live stage is highlighted). *(Alternative under consideration: status columns To do / In progress / In review / Done — see open question.)*
- **Cards = tasks** sitting in their stage. A card shows title, assignee avatar, due date, and a status dot.
- Drag a card between columns to move a task to another stage (subject to the mover's stage scope).
- Each column header shows the stage's review state (In progress / In review / Approved) and a task count.
- Board scrolls horizontally; phase bands (Win / Deliver / Close) can group columns to tame width.

## 14. Tasks & issues

- **Create task** — anyone can create a task for **themselves**; users with the *create-tasks* capability can create and **assign to others**. Fields: title, description, assignee, due date, the study/stage it belongs to, status (To do / In progress / In review / Done).
- **Where they appear** — as kanban cards (§13), in a stage's Tasks list (§4), in the assignee's **For-you list** (§2.3) and as a **notification** on assignment.
- **Distinct from gate items** — gate items are advancement *conditions* (a checklist the reviewer verifies); tasks are assignable *work*. A task may reference a gate item but they're separate.

## 15. Workflow (admin) & timestamps

- **Workflow** — the ordered list of **stages** and each stage's **gate checklist** is an admin-editable template (add / remove / reorder stages, edit gate items). The 9 default stages ship pre-filled; "delete stage" and "create gates" are the capabilities that gate this screen.
- **Audit / date-time** — every action that changes anything (complete a gate item, submit/approve/advance a stage, upload, send/log email, create/move a task) is stamped with **actor + date + time** and surfaced in the node's activity feed and inline on the item ("by Priya R. · 5 Jun, 09:30"). Time is always visible, never hidden behind a hover.

---

## Open questions to resolve
1. **Stages** — editable workflow template (admin add/remove/reorder, 9 as default) *(assumed)*, or fixed 9?
2. **Kanban columns** — stages *(assumed)*, or status (To do / In progress / In review / Done)?

---

**Signature element:** the left **tree** itself is the product's identity — keep it crisp, fast, and badge-aware. Everything else stays quiet so the tree and the "For you" surface do the work.
