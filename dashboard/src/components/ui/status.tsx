import { cva } from "class-variance-authority";
import { Check, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Status } from "@/lib/vitals/types";

export type { Status };

const STATUS_META = {
  normal: { label: "Normal", Icon: Check },
  warning: { label: "Warning", Icon: TriangleAlert },
  critical: { label: "Critical", Icon: OctagonAlert },
} as const;

const dotColor: Record<Status, string> = {
  normal: "text-normal-solid",
  warning: "text-warning-solid",
  critical: "text-critical-solid",
};

export const statusText: Record<Status, string> = {
  normal: "text-normal",
  warning: "text-warning",
  critical: "text-critical",
};

export const statusMark: Record<Status, string> = {
  normal: "text-normal-solid",
  warning: "text-warning-solid",
  critical: "text-critical-solid",
};

export function StatusDot({
  status,
  muted = false,
  className,
}: {
  status: Status;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-pulse={!muted && status === "critical"}
      data-quiet={muted}
      className={cn("status-dot", muted ? "text-ink-subtle" : dotColor[status], className)}
    />
  );
}

const badge = cva(
  [
    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5",
    "text-xs font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow] duration-300 ease-out",
  ],
  {
    variants: {
      status: {
        normal: "glow-normal border-normal-line bg-normal-soft text-normal",
        warning: "glow-warning border-warning-line bg-warning-soft text-warning",
        critical: "glow-critical border-critical-line bg-critical-soft text-critical",
      },
    },
  },
);

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const { label, Icon } = STATUS_META[status];
  return (
    <span className={cn(badge({ status }), className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
