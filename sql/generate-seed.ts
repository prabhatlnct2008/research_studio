// Generates sql/02_seed.sql — raw INSERTs mirroring src/db/seed.ts.
// Run:  npx tsx sql/generate-seed.ts
// Override the seeded admin via env: SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD / SUPERADMIN_NAME
import { writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { CAPABILITIES, DEFAULT_GATE_TEMPLATES, STAGE_COUNT } from "../src/lib/constants";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const now = Date.now();
const lines: string[] = [];

const email = (process.env.SUPERADMIN_EMAIL || "admin@studio.local").toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD || "ChangeMe!123";
const name = process.env.SUPERADMIN_NAME || "Principal Admin";
const hash = bcrypt.hashSync(password, 10);

// Fixed IDs so foreign keys line up and re-runs are idempotent.
const PRINCIPAL = "00000000-0000-4000-8000-000000000001";
const RESEARCHER = "00000000-0000-4000-8000-000000000002";
const ADMIN = "00000000-0000-4000-8000-000000000010";
const CLIENT = "00000000-0000-4000-8000-000000000100";
const STUDY = "00000000-0000-4000-8000-000000000200";

lines.push("-- Studio seed — INSERT/UPDATE statements (idempotent via INSERT OR IGNORE).");
lines.push("-- Apply AFTER sql/01_schema.sql:  turso db shell <db> < sql/02_seed.sql");
lines.push(`-- Superadmin login: ${email} / ${password}  (change it after first sign-in)`);
lines.push("");

// Roles
const allCaps = JSON.stringify(Object.fromEntries(CAPABILITIES.map((c) => [c, true])));
const fullScope = JSON.stringify(Array.from({ length: STAGE_COUNT }, (_, i) => i));
lines.push("-- Roles");
lines.push(
  `INSERT OR IGNORE INTO roles (id, name, stage_scope, capabilities, is_builtin, created_at) VALUES (${q(PRINCIPAL)}, 'Principal', ${q(fullScope)}, ${q(allCaps)}, 1, ${now});`,
);
const researcherCaps = JSON.stringify({ work_on_stage: true, create_tasks: true, review_stage: true });
const researcherScope = JSON.stringify([0, 1, 2, 4, 5, 6, 7]);
lines.push(
  `INSERT OR IGNORE INTO roles (id, name, stage_scope, capabilities, is_builtin, created_at) VALUES (${q(RESEARCHER)}, 'Researcher', ${q(researcherScope)}, ${q(researcherCaps)}, 0, ${now});`,
);
lines.push("");

// Superadmin user
lines.push("-- Superadmin (password auth)");
lines.push(
  `INSERT OR IGNORE INTO users (id, name, email, password_hash, must_change_password, role_id, status, invited_by, created_at) VALUES (${q(ADMIN)}, ${q(name)}, ${q(email)}, ${q(hash)}, 0, ${q(PRINCIPAL)}, 'active', NULL, ${now});`,
);
lines.push("");

// Gate templates
lines.push("-- Gate templates (seed future studies)");
let g = 0;
for (const [stageIndex, labels] of Object.entries(DEFAULT_GATE_TEMPLATES)) {
  labels.forEach((label, order) => {
    const id = `00000000-0000-4000-8000-0000000003${String(g++).padStart(2, "0")}`;
    lines.push(
      `INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES (${q(id)}, ${stageIndex}, ${q(label)}, ${order}, ${now});`,
    );
  });
}
lines.push("");

// Demo client + study
const endDate = now + 1000 * 60 * 60 * 24 * 90;
lines.push("-- Demo client + study");
lines.push(
  `INSERT OR IGNORE INTO clients (id, name, sector, location, status, owner_id, created_at) VALUES (${q(CLIENT)}, 'Northwind Foods', 'FMCG', 'London, UK', 'active', ${q(ADMIN)}, ${now});`,
);
lines.push(
  `INSERT OR IGNORE INTO studies (id, client_id, name, type, lead_id, start_date, expected_end_date, actual_end_date, current_stage, status, created_at) VALUES (${q(STUDY)}, ${q(CLIENT)}, 'Brand Tracker 2026', 'Quantitative', ${q(ADMIN)}, ${now}, ${endDate}, NULL, 0, 'active', ${now});`,
);
lines.push("");

// 9 stage instances; stage 0 in progress.
lines.push("-- Stage instances");
for (let i = 0; i < STAGE_COUNT; i++) {
  const id = `00000000-0000-4000-8000-0000000004${String(i).padStart(2, "0")}`;
  const state = i === 0 ? "in_progress" : "not_started";
  const entered = i === 0 ? String(now) : "NULL";
  lines.push(
    `INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES (${q(id)}, ${q(STUDY)}, ${i}, '${state}', ${entered}, ${now});`,
  );
}
lines.push("");

// Stage 0 gate items seeded from template.
lines.push("-- Stage 0 gate items (seeded from template)");
DEFAULT_GATE_TEMPLATES[0].forEach((label, order) => {
  const id = `00000000-0000-4000-8000-0000000005${String(order).padStart(2, "0")}`;
  lines.push(
    `INSERT OR IGNORE INTO gate_items (id, study_id, stage_index, label, "order", status, created_at) VALUES (${q(id)}, ${q(STUDY)}, 0, ${q(label)}, ${order}, 'open', ${now});`,
  );
});
lines.push("");

writeFileSync("sql/02_seed.sql", lines.join("\n"));
console.log(`Wrote sql/02_seed.sql (${lines.length} lines). Admin: ${email} / ${password}`);
