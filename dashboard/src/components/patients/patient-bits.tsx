import { cn } from "@/lib/cn";
import { RISK_LABEL, RISK_SCORE, type RiskLevel } from "@/lib/vitals/types";

export function initialsOf(name: string): string {
  const words = name.replace(/^Dr\s+/i, "").split(/\s+/);
  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-inset font-medium text-ink-muted",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-14 text-lg",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function RiskBars({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  const filled = RISK_SCORE[level];
  return (
    <span
      role="img"
      aria-label={RISK_LABEL[level]}
      title={RISK_LABEL[level]}
      className={cn("inline-flex items-end gap-0.5", className)}
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-full",
            bar === 1 && "h-1.5",
            bar === 2 && "h-2.5",
            bar === 3 && "h-3.5",
            bar <= filled ? "bg-ink-muted" : "bg-line-strong",
          )}
        />
      ))}
    </span>
  );
}

export function ConditionChips({
  conditions,
  className,
}: {
  conditions: string[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {conditions.map((condition) => (
        <li
          key={condition}
          className="rounded-full border border-line bg-inset px-2.5 py-1 text-xs text-ink-muted"
        >
          {condition}
        </li>
      ))}
    </ul>
  );
}
