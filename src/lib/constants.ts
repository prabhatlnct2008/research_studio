// The 9 fixed stages (FRD §4.6 / FR-STG-1). Structure is NOT editable in v1 —
// only the gate *content* per stage is admin-managed.
export const STAGES = [
  "Intake",
  "Plan & budget",
  "Proposal",
  "Sign-off",
  "Setup",
  "Recruitment",
  "Analysis",
  "Report",
  "Wrap-up",
] as const;

export type StageName = (typeof STAGES)[number];
export const STAGE_COUNT = STAGES.length;

// Phase bands group the kanban columns (UI spec §13).
export const PHASE_BANDS: { label: string; stages: number[] }[] = [
  { label: "Win", stages: [0, 1, 2, 3] },
  { label: "Deliver", stages: [4, 5, 6, 7] },
  { label: "Close", stages: [8] },
];

export function phaseForStage(stageIndex: number): string {
  return PHASE_BANDS.find((b) => b.stages.includes(stageIndex))?.label ?? "";
}

// Capability flags (FRD §3).
export const CAPABILITIES = [
  "work_on_stage",
  "advance_stage",
  "review_stage",
  "create_gates",
  "create_tasks",
  "assign_tasks",
  "create_clients",
  "create_studies",
  "create_roles",
  "manage_users",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  work_on_stage: "Work on stages",
  advance_stage: "Advance a stage",
  review_stage: "Review / approve a stage",
  create_gates: "Create & edit gates",
  create_tasks: "Create tasks",
  assign_tasks: "Assign tasks to others",
  create_clients: "Create clients",
  create_studies: "Create studies",
  create_roles: "Create & edit roles",
  manage_users: "Manage users",
};

// Default gate template items seeded per stage (admin-editable thereafter).
export const DEFAULT_GATE_TEMPLATES: Record<number, string[]> = {
  0: ["Brief received & logged", "Client objectives captured", "Feasibility confirmed"],
  1: ["Methodology drafted", "Budget estimated", "Timeline agreed internally"],
  2: ["Proposal document written", "Internal pricing review", "Proposal sent to client"],
  3: ["Client sign-off received", "Contract / PO logged", "Kick-off scheduled"],
  4: ["Questionnaire / discussion guide built", "Sample & quotas defined", "Fieldwork tools set up"],
  5: ["Recruitment screener live", "Quotas filled", "Fieldwork QA passed"],
  6: ["Data cleaned & coded", "Analysis plan executed", "Key findings drafted"],
  7: ["Report drafted", "Internal review complete", "Report delivered to client"],
  8: ["Debrief held", "Invoice raised", "Project archived"],
};

export type StageState =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "approved"
  | "advanced";

export const STAGE_STATE_LABELS: Record<StageState, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  in_review: "In review",
  approved: "Approved",
  advanced: "Advanced",
};
