import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  clients,
  gateItems,
  gateTemplateItems,
  roles,
  stageInstances,
  studies,
  users,
} from "./schema";
import {
  CAPABILITIES,
  DEFAULT_GATE_TEMPLATES,
  STAGE_COUNT,
} from "../lib/constants";
import { hashPassword } from "../lib/password";

async function main() {
  const email = (process.env.SUPERADMIN_EMAIL || "admin@studio.local").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "ChangeMe!123";
  const name = process.env.SUPERADMIN_NAME || "Principal Admin";

  // 1. Built-in Principal role — all capabilities, full stage scope.
  let [principal] = await db.select().from(roles).where(eq(roles.isBuiltin, true)).limit(1);
  if (!principal) {
    const caps = Object.fromEntries(CAPABILITIES.map((c) => [c, true]));
    [principal] = await db
      .insert(roles)
      .values({
        name: "Principal",
        isBuiltin: true,
        stageScope: Array.from({ length: STAGE_COUNT }, (_, i) => i),
        capabilities: caps,
      })
      .returning();
    console.log("Created Principal role.");
  }

  // A scoped example role for demos.
  const [existingResearcher] = await db.select().from(roles).where(eq(roles.name, "Researcher")).limit(1);
  if (!existingResearcher) {
    await db.insert(roles).values({
      name: "Researcher",
      isBuiltin: false,
      stageScope: [0, 1, 2, 4, 5, 6, 7],
      capabilities: {
        work_on_stage: true,
        create_tasks: true,
        review_stage: true,
      },
    });
    console.log("Created Researcher role.");
  }

  // 2. Superadmin user (password auth; not invite-only).
  let [admin] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: await hashPassword(password),
        mustChangePassword: false,
        roleId: principal.id,
        status: "active",
      })
      .returning();
    console.log(`Created superadmin: ${email} / ${password}`);
  } else {
    console.log(`Superadmin already exists: ${email}`);
  }

  // 3. Gate templates per stage.
  const existingTemplates = await db.select().from(gateTemplateItems).limit(1);
  if (existingTemplates.length === 0) {
    for (const [stageIndex, labels] of Object.entries(DEFAULT_GATE_TEMPLATES)) {
      await db.insert(gateTemplateItems).values(
        labels.map((label, order) => ({
          stageIndex: Number(stageIndex),
          label,
          order,
        })),
      );
    }
    console.log("Seeded gate templates for 9 stages.");
  }

  // 4. Demo client + study, stage 0 opened with seeded gate items.
  const [existingClient] = await db.select().from(clients).where(eq(clients.name, "Northwind Foods")).limit(1);
  if (!existingClient) {
    const [client] = await db
      .insert(clients)
      .values({
        name: "Northwind Foods",
        sector: "FMCG",
        location: "London, UK",
        status: "active",
        ownerId: admin.id,
      })
      .returning();

    const [study] = await db
      .insert(studies)
      .values({
        clientId: client.id,
        name: "Brand Tracker 2026",
        type: "Quantitative",
        leadId: admin.id,
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        currentStage: 0,
        status: "active",
      })
      .returning();

    // Open all 9 stage instances; stage 0 in progress, rest not started.
    for (let i = 0; i < STAGE_COUNT; i++) {
      await db.insert(stageInstances).values({
        studyId: study.id,
        stageIndex: i,
        state: i === 0 ? "in_progress" : "not_started",
        enteredAt: i === 0 ? new Date() : null,
      });
    }

    // Seed stage 0 gate items from template.
    const tmpl = await db.select().from(gateTemplateItems).where(eq(gateTemplateItems.stageIndex, 0));
    if (tmpl.length) {
      await db.insert(gateItems).values(
        tmpl.map((t) => ({
          studyId: study.id,
          stageIndex: 0,
          label: t.label,
          order: t.order,
          status: "open" as const,
        })),
      );
    }
    console.log("Seeded demo client + study (Northwind Foods / Brand Tracker 2026).");
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
