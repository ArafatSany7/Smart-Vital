import { Clock, Pause, WifiOff } from "lucide-react";
import { StatusDot } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import type { FeedHealth } from "@/lib/vitals/feed";

const LABEL: Record<FeedHealth, string> = {
  waiting: "Waiting for data",
  live: "Live",
  delayed: "Delayed",
  offline: "Offline",
};

export function FeedHealthChip({
  health,
  paused,
  className,
}: {
  health: FeedHealth;
  paused: boolean;
  className?: string;
}) {
  const problem = !paused && (health === "delayed" || health === "offline");
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color] duration-300 ease-out",
        problem
          ? "border-warning-line bg-warning-soft text-warning"
          : "border-line bg-inset text-ink-muted",
        className,
      )}
    >
      {paused ? (
        <Pause className="size-3.5" aria-hidden="true" />
      ) : health === "offline" ? (
        <WifiOff className="size-3.5" aria-hidden="true" />
      ) : health === "delayed" ? (
        <Clock className="size-3.5" aria-hidden="true" />
      ) : (
        <StatusDot status="normal" className="text-accent" />
      )}
      {paused ? "Paused" : LABEL[health]}
    </span>
  );
}
