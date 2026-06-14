type Tone = "green" | "amber" | "red" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  green: "bg-green-bg text-green",
  amber: "bg-amber-bg text-amber",
  red: "bg-red-bg text-red",
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`pill ${tones[tone]}`}>{children}</span>;
}

export function RiskPill({ risk }: { risk: "track" | "watch" | "risk" }) {
  if (risk === "risk") return <Pill tone="red">At risk</Pill>;
  if (risk === "watch") return <Pill tone="amber">Watch</Pill>;
  return <Pill tone="green">On track</Pill>;
}
