import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  pill,
  action,
}: {
  eyebrow: string;
  title: string;
  pill?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow mb-1">{eyebrow}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-title font-bold text-ink">{title}</h1>
          {pill}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const barColors: Record<string, string> = {
  accent: "bg-accent",
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  muted: "bg-faint",
};

export function Tile({
  value,
  label,
  bar = "accent",
}: {
  value: React.ReactNode;
  label: string;
  bar?: keyof typeof barColors;
}) {
  return (
    <div className="card relative overflow-hidden p-4 pl-5">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${barColors[bar]}`} aria-hidden />
      <p className="tnum text-[26px] font-bold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-meta text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface-2/50 px-6 py-10 text-center">
      <p className="text-body font-medium text-ink">{title}</p>
      {hint && <p className="max-w-sm text-meta text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function ListRow({
  href,
  icon,
  title,
  meta,
  right,
  accent = false,
}: {
  href?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  accent?: boolean;
}) {
  const inner = (
    <div
      className={[
        "flex min-h-[56px] items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-shadow hover:shadow-hover",
        accent ? "border-l-[3px] border-l-accent" : "",
      ].join(" ")}
    >
      {icon && <span className="shrink-0 text-accent">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-medium text-ink">{title}</div>
        {meta && <div className="truncate text-meta text-muted">{meta}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
  return href ? (
    <Link href={href} prefetch className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function NeedsYouTag() {
  return (
    <span className="pill bg-accent-soft text-accent">Needs you</span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-card-title font-semibold text-ink">{children}</h2>;
}

export function Breadlink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-meta text-accent hover:underline">
      {children}
    </Link>
  );
}
