import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLog,
  clients,
  documents,
  emails,
  gateItems,
  notifications,
  stageInstances,
  studies,
  tasks,
  users,
} from "@/db/schema";
import { STAGE_COUNT, type StageState } from "@/lib/constants";
import { isOverdue } from "@/lib/format";

export type Risk = "track" | "watch" | "risk";

export function studyRisk(study: {
  status: string;
  expectedEndDate: Date | null;
}): Risk {
  if (study.status !== "active") return "track";
  if (!study.expectedEndDate) return "track";
  if (isOverdue(study.expectedEndDate)) return "risk";
  const week = 1000 * 60 * 60 * 24 * 7;
  if (study.expectedEndDate.getTime() - Date.now() < week) return "watch";
  return "track";
}

export type StageNode = {
  index: number;
  state: StageState;
  emails: number;
  documents: number;
  notifications: number;
};

export type StudyNode = {
  id: string;
  clientId: string;
  name: string;
  status: string;
  currentStage: number;
  risk: Risk;
  stages: StageNode[];
};

export type ClientNode = {
  id: string;
  name: string;
  status: string;
  studies: StudyNode[];
};

// Full tree (clients → studies → stages + section counts). Sized for a small
// team, so we read the tables and group in memory.
export async function getTreeData(): Promise<ClientNode[]> {
  const [allClients, allStudies, allStages, allEmails, allDocs, allNotifs] =
    await Promise.all([
      db.select().from(clients).orderBy(clients.name),
      db.select().from(studies).orderBy(studies.name),
      db.select().from(stageInstances),
      db.select({ studyId: emails.studyId, stageIndex: emails.stageIndex }).from(emails),
      db.select({ studyId: documents.studyId, stageIndex: documents.stageIndex }).from(documents),
      db
        .select({ studyId: notifications.studyId, stageIndex: notifications.stageIndex })
        .from(notifications),
    ]);

  const countKey = (s: string, i: number) => `${s}:${i}`;
  const tally = (rows: { studyId: string | null; stageIndex: number | null }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!r.studyId || r.stageIndex == null) continue;
      const k = countKey(r.studyId, r.stageIndex);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const emailCounts = tally(allEmails);
  const docCounts = tally(allDocs);
  const notifCounts = tally(allNotifs);

  const stageByStudy = new Map<string, Map<number, StageState>>();
  for (const s of allStages) {
    if (!stageByStudy.has(s.studyId)) stageByStudy.set(s.studyId, new Map());
    stageByStudy.get(s.studyId)!.set(s.stageIndex, s.state as StageState);
  }

  return allClients.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    studies: allStudies
      .filter((s) => s.clientId === c.id)
      .map((s) => {
        const stateMap = stageByStudy.get(s.id) ?? new Map();
        const stages: StageNode[] = Array.from({ length: STAGE_COUNT }, (_, i) => ({
          index: i,
          state: (stateMap.get(i) as StageState) ?? "not_started",
          emails: emailCounts.get(countKey(s.id, i)) ?? 0,
          documents: docCounts.get(countKey(s.id, i)) ?? 0,
          notifications: notifCounts.get(countKey(s.id, i)) ?? 0,
        }));
        return {
          id: s.id,
          clientId: s.clientId,
          name: s.name,
          status: s.status,
          currentStage: s.currentStage,
          risk: studyRisk(s),
          stages,
        };
      }),
  }));
}

export async function getActiveUsers() {
  return db
    .select()
    .from(users)
    .where(inArray(users.status, ["invited", "active"]))
    .orderBy(users.name);
}

export async function getStudyActivity(studyId: string, limit = 30) {
  return db
    .select({
      id: activityLog.id,
      type: activityLog.type,
      summary: activityLog.summary,
      createdAt: activityLog.createdAt,
      actorName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.actorId, users.id))
    .where(eq(activityLog.studyId, studyId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export async function getStageGateItems(studyId: string, stageIndex: number) {
  return db
    .select()
    .from(gateItems)
    .where(and(eq(gateItems.studyId, studyId), eq(gateItems.stageIndex, stageIndex)))
    .orderBy(gateItems.order);
}

export async function getStageTasks(studyId: string, stageIndex: number) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.studyId, studyId), eq(tasks.stageIndex, stageIndex)))
    .orderBy(tasks.createdAt);
}
