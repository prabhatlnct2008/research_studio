# Studio

A delivery-management workspace for a small market-research team, organised as a
navigable tree:

```
Workspace → Client → Study → Stage (×9, fixed) → { Emails · Notifications · Documents }
```

Studio manages each study through nine fixed stages with admin-defined roles,
per-stage gate checklists, a maker-checker review before any stage advances,
assignable tasks, a per-study kanban board, and a complete timestamped audit
trail.

## Stack

- **Next.js (App Router)** + TypeScript + React Server Components; mutations via
  Server Actions (`runtime = "nodejs"` where the DB / Blob / email is touched).
- **Turso (libSQL / SQLite)** via **Drizzle ORM** + drizzle-kit migrations.
- **Vercel Blob** for documents + raw `.eml` files (local-disk fallback in dev).
- **Resend** for outbound study email (console fallback in dev).
- **Auth.js v5** with a **password credentials** provider.
- **Tailwind CSS** themed with the design-system-v2 tokens; Lucide line icons.

## Authentication

Password-based, **not** invite-only magic link:

- A **superadmin (Principal)** is seeded with a password (see env vars).
- The superadmin adds other users from **Admin → Users**, and a **temporary
  password** is generated for each to share.
- New users are prompted to **change their password on first sign-in**
  (`mustChangePassword`).
- Disabled users cannot sign in. Users are never hard-deleted — only disabled —
  preserving audit attribution.

## Local setup

```bash
npm install
cp .env.example .env.local      # adjust as needed
npm run db:migrate              # apply migrations (creates ./local.db if unset)
npm run db:seed                 # Principal role, superadmin, gate templates, demo data
npm run dev
```

With no external services configured, the app runs fully against a local SQLite
file (`./local.db`), local-disk blob storage (`./.localblob`), and console email.

Default seeded superadmin: `admin@studio.local` / `ChangeMe!123` (override via
`SUPERADMIN_*` env vars before seeding).

## Production env vars

| Var | Purpose |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Turso libSQL database |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store |
| `AUTH_SECRET` | Auth.js session secret (≥32 bytes) |
| `RESEND_API_KEY`, `MAIL_FROM` | Outbound email (verified Resend domain) |
| `APP_URL` | Canonical deployed URL |

## Non-negotiable rules enforced

1. **Server-side authorization** on every action (`src/lib/authz.ts`): role
   capabilities + stage scope. Outside scope = read-only.
2. **Append-only audit** (`src/lib/activity.ts`): every state change writes an
   immutable activity entry with actor + timestamp.
3. **Maker-checker** (`src/actions/stages.ts`): a stage advances only after a
   *different* user with the review capability approves; advance is disabled
   until `approved`.
4. **No hard deletes** of people or studies — users are disabled, studies are
   archived. The audit log is never edited or deleted.
5. **Pending-on-you** (`src/lib/pending.ts`): computed from open tasks, review
   requests, owned next actions, and unread targeted notifications — surfaced in
   the For-you list, propagating tree badges, and the bell.
6. **Stages fixed at 9**; gate *content* is admin-editable, stage structure is
   not.

## Project layout

```
src/
  app/                      App Router routes (login, change-password, (app) shell, api)
  actions/                  Server Actions (authorized + audited mutations)
  components/               UI: shell (tree/for-you/breadcrumb), stage, study, admin, forms, ui
  db/                       Drizzle schema, client, migrate, seed
  lib/                      authz, activity, pending, data, storage, email, constants, format
drizzle/                    Generated SQL migrations
```
