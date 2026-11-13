"use client";

import { BellRing, OctagonAlert, X } from "lucide-react";
import { describeVital } from "@/components/alerts/alert-format";
import { button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Alert } from "@/lib/vitals/alerts";
import { formatClock } from "@/lib/vitals/display";
import type { Patient } from "@/lib/vitals/types";

export function AlertToastCard({
  alert,
  patient,
  others,
  onOpen,
  onAcknowledge,
  onShowAll,
  onClose,
}: {
  alert: Alert;
  patient: Patient | null;
  others: number;
  onOpen: () => void;
  onAcknowledge: () => void;
  onShowAll: () => void;
  onClose: () => void;
}) {
  const escalated = alert.escalatedAt !== null;

  return (
    <div
      role="alert"
      className="relative w-[min(360px,calc(100vw-2rem))] overflow-hidden glass-pop glow-critical rounded-2xl border border-critical-line py-3 pr-3 pl-4"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-critical-solid" />

      <div className="flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold tracking-wide text-critical uppercase">
          {escalated ? (
            <BellRing className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <OctagonAlert className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{escalated ? "Critical · not acknowledged" : "Critical"}</span>
        </p>
        <time
          dateTime={new Date(alert.startedAt).toISOString()}
          className="numeric shrink-0 text-xs text-ink-muted"
        >
          {formatClock(alert.startedAt)}
        </time>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide this notification"
          className="-my-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-inset hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-1 truncate text-sm font-medium text-ink">
        <span className="font-mono">{alert.patientId}</span>
        {patient ? <span className="text-ink-muted"> · {patient.name}</span> : null}
      </p>
      <p className="numeric mt-0.5 line-clamp-2 text-xs text-ink-muted">
        {alert.trigger.map(describeVital).join(" · ")}
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <button type="button" onClick={onAcknowledge} className={button({ size: "sm" })}>
          Acknowledge
        </button>
        <button type="button" onClick={onOpen} className={button({ intent: "secondary", size: "sm" })}>
          Open patient
        </button>
        {others > 0 ? (
          <button
            type="button"
            onClick={onShowAll}
            className={cn(button({ intent: "ghost", size: "sm" }), "ml-auto px-2")}
          >
            +{others} more
          </button>
        ) : null}
      </div>
    </div>
  );
}
