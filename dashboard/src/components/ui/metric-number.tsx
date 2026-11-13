import { cn } from "@/lib/cn";
import type { Status } from "@/lib/vitals/types";

export function MetricNumber({
  value,
  decimals = 0,
  status,
  className,
}: {
  value: number;
  decimals?: number;
  status?: Status;
  className?: string;
}) {
  const text = value.toFixed(decimals);
  return (
    <span
      key={text}
      data-status={status}
      className={cn("metric metric-tick numeric", className)}
    >
      {text}
    </span>
  );
}
