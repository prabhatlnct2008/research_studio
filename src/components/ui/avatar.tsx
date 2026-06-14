import { initials } from "@/lib/format";

export function Avatar({
  name,
  isMe = false,
  size = 28,
}: {
  name: string;
  isMe?: boolean;
  size?: number;
}) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        isMe ? "bg-accent text-white" : "bg-surface-2 text-muted",
      ].join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name) || "?"}
    </span>
  );
}
