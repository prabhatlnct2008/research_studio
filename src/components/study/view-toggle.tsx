import Link from "next/link";

export function ViewToggle({ studyId, active }: { studyId: string; active: "overview" | "board" }) {
  const base = "px-3 py-1.5 text-meta font-medium rounded-[8px] transition-colors";
  return (
    <div className="inline-flex rounded-[10px] border border-border bg-surface p-0.5">
      <Link
        href={`/studies/${studyId}`}
        className={`${base} ${active === "overview" ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
      >
        Overview
      </Link>
      <Link
        href={`/studies/${studyId}?view=board`}
        className={`${base} ${active === "board" ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
      >
        Board
      </Link>
    </div>
  );
}
