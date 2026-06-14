import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Roles & users (FRD §3, §5.1)
// ---------------------------------------------------------------------------

export const roles = sqliteTable("roles", {
  id: id(),
  name: text("name").notNull(),
  // JSON array of stage indices (0-8) the role may act on.
  stageScope: text("stage_scope", { mode: "json" })
    .$type<number[]>()
    .notNull()
    .default([]),
  // JSON object of capability flag -> boolean.
  capabilities: text("capabilities", { mode: "json" })
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  // Force a password change on next sign-in (temp passwords issued by admin).
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(false),
  roleId: text("role_id").references(() => roles.id),
  status: text("status", { enum: ["invited", "active", "disabled"] })
    .notNull()
    .default("invited"),
  invitedBy: text("invited_by"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Clients & contacts (FRD §4.3)
// ---------------------------------------------------------------------------

export const clients = sqliteTable("clients", {
  id: id(),
  name: text("name").notNull(),
  sector: text("sector"),
  location: text("location"),
  status: text("status", { enum: ["lead", "active", "dormant"] })
    .notNull()
    .default("active"),
  ownerId: text("owner_id").references(() => users.id),
  createdAt: createdAt(),
});

export const contacts = sqliteTable("contacts", {
  id: id(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Studies & stage instances (FRD §4.4, §4.6, §4.7)
// ---------------------------------------------------------------------------

export const studies = sqliteTable("studies", {
  id: id(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  name: text("name").notNull(),
  type: text("type"),
  leadId: text("lead_id").references(() => users.id),
  startDate: integer("start_date", { mode: "timestamp_ms" }),
  expectedEndDate: integer("expected_end_date", { mode: "timestamp_ms" }),
  actualEndDate: integer("actual_end_date", { mode: "timestamp_ms" }),
  currentStage: integer("current_stage").notNull().default(0),
  status: text("status", { enum: ["active", "closed", "lost"] })
    .notNull()
    .default("active"),
  createdAt: createdAt(),
});

export const stageInstances = sqliteTable(
  "stage_instances",
  {
    id: id(),
    studyId: text("study_id")
      .notNull()
      .references(() => studies.id),
    stageIndex: integer("stage_index").notNull(),
    state: text("state", {
      enum: ["not_started", "in_progress", "in_review", "approved", "advanced"],
    })
      .notNull()
      .default("not_started"),
    enteredAt: integer("entered_at", { mode: "timestamp_ms" }),
    submittedBy: text("submitted_by").references(() => users.id),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    reviewerId: text("reviewer_id").references(() => users.id),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    advancedBy: text("advanced_by").references(() => users.id),
    advancedAt: integer("advanced_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),
    createdAt: createdAt(),
  },
);

// ---------------------------------------------------------------------------
// Gate templates & gate items (FRD §4.6)
// ---------------------------------------------------------------------------

export const gateTemplateItems = sqliteTable("gate_template_items", {
  id: id(),
  stageIndex: integer("stage_index").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: createdAt(),
});

export const gateItems = sqliteTable("gate_items", {
  id: id(),
  studyId: text("study_id")
    .notNull()
    .references(() => studies.id),
  stageIndex: integer("stage_index").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
  status: text("status", { enum: ["open", "wip", "done"] })
    .notNull()
    .default("open"),
  doneBy: text("done_by").references(() => users.id),
  doneAt: integer("done_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Emails (FRD §4.8)
// ---------------------------------------------------------------------------

export const emails = sqliteTable("emails", {
  id: id(),
  studyId: text("study_id")
    .notNull()
    .references(() => studies.id),
  stageIndex: integer("stage_index").notNull(),
  threadId: text("thread_id").notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  fromAddr: text("from_addr").notNull(),
  toAddr: text("to_addr").notNull(),
  subject: text("subject"),
  body: text("body"),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  source: text("source", { enum: ["upload", "compose", "forward"] }).notNull(),
  rawFileRef: text("raw_file_ref"),
  messageId: text("message_id"),
  status: text("status", { enum: ["logged", "sent", "failed"] })
    .notNull()
    .default("logged"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Documents (FRD §4.9)
// ---------------------------------------------------------------------------

export const documents = sqliteTable("documents", {
  id: id(),
  studyId: text("study_id")
    .notNull()
    .references(() => studies.id),
  stageIndex: integer("stage_index").notNull(),
  name: text("name").notNull(),
  fileType: text("file_type"),
  fileRef: text("file_ref").notNull(),
  size: integer("size"),
  uploadedBy: text("uploaded_by").references(() => users.id),
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// Notifications (FRD §4.10)
// ---------------------------------------------------------------------------

export const notifications = sqliteTable("notifications", {
  id: id(),
  studyId: text("study_id").references(() => studies.id),
  stageIndex: integer("stage_index"),
  kind: text("kind").notNull(),
  text: text("text").notNull(),
  // When set, this notification drives "pending on you" for the target user.
  targetUserId: text("target_user_id").references(() => users.id),
  link: text("link"),
  readAt: integer("read_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Tasks / issues (FRD §4.11)
// ---------------------------------------------------------------------------

export const tasks = sqliteTable("tasks", {
  id: id(),
  studyId: text("study_id")
    .notNull()
    .references(() => studies.id),
  stageIndex: integer("stage_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: text("assignee_id").references(() => users.id),
  reporterId: text("reporter_id").references(() => users.id),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  status: text("status", {
    enum: ["todo", "in_progress", "in_review", "done"],
  })
    .notNull()
    .default("todo"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// Activity log — append-only, immutable (FRD §4.14)
// ---------------------------------------------------------------------------

export const activityLog = sqliteTable("activity_log", {
  id: id(),
  studyId: text("study_id"),
  actorId: text("actor_id").references(() => users.id),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  targetRef: text("target_ref"),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Study = typeof studies.$inferSelect;
export type StageInstance = typeof stageInstances.$inferSelect;
export type GateItem = typeof gateItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ActivityEntry = typeof activityLog.$inferSelect;
