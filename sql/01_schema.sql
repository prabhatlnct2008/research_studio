-- Studio schema — CREATE statements.
-- Apply first:  turso db shell <db> < sql/01_schema.sql
-- (Equivalent to the drizzle migration in drizzle/0000_wide_overlord.sql.)

CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text,
	`actor_id` text,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`target_ref` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector` text,
	`location` text,
	`status` text DEFAULT 'active' NOT NULL,
	`owner_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`name` text NOT NULL,
	`file_type` text,
	`file_ref` text NOT NULL,
	`size` integer,
	`uploaded_by` text,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`thread_id` text NOT NULL,
	`direction` text NOT NULL,
	`from_addr` text NOT NULL,
	`to_addr` text NOT NULL,
	`subject` text,
	`body` text,
	`occurred_at` integer NOT NULL,
	`source` text NOT NULL,
	`raw_file_ref` text,
	`message_id` text,
	`status` text DEFAULT 'logged' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `gate_items` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`label` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`done_by` text,
	`done_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`done_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `gate_template_items` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_index` integer NOT NULL,
	`label` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text,
	`stage_index` integer,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`target_user_id` text,
	`link` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stage_scope` text DEFAULT '[]' NOT NULL,
	`capabilities` text DEFAULT '{}' NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `stage_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`state` text DEFAULT 'not_started' NOT NULL,
	`entered_at` integer,
	`submitted_by` text,
	`submitted_at` integer,
	`reviewer_id` text,
	`reviewed_at` integer,
	`advanced_by` text,
	`advanced_at` integer,
	`review_note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`advanced_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `studies` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`lead_id` text,
	`start_date` integer,
	`expected_end_date` integer,
	`actual_end_date` integer,
	`current_stage` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`study_id` text NOT NULL,
	`stage_index` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assignee_id` text,
	`reporter_id` text,
	`due_date` integer,
	`status` text DEFAULT 'todo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`must_change_password` integer DEFAULT false NOT NULL,
	`role_id` text,
	`status` text DEFAULT 'invited' NOT NULL,
	`invited_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);