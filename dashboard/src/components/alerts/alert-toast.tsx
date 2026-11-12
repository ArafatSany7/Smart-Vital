"use client";

import { BellRing, Check, OctagonAlert, X } from "lucide-react";
import { describeVital } from "@/components/alerts/alert-format";
import { button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { alertState, type Alert } from "@/lib/vitals/alerts";
import { formatClock } from "@/lib/vitals/display";
import type { Patient } from "@/lib/vitals/types";

export function AlertToastCard({
  alert,
  patient,
  onOpen,
  onAcknowledge,
  onClose,
}: {
  alert: Alert;
  patient: Patient | null;
  onOpen: () => void;
  onAcknowledge: () => void;
  onClose: () => void;
}) {
  const state = alertState(alert);
  const escalated = alert.escalatedAt !== null && state === "open";
  const resolved = state === "resolved";

  return (
    <div
      role="alert"
      className={cn(
        "relative w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-surface p-4 pl-5 shadow-tile",
        resolved ? "border-line" : "border-critical-line",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          resolved ? "bg-ink-subtle" : "bg-critical-solid",
        )}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close this notification"
        className="absolute top-2.5 right-2.5 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-inset hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <p
        className={cn(
          "flex items-center gap-2 pr-8 text-xs font-semibold tracking-wide uppercase",
          resolved ? "text-ink-muted" : "text-critical",
        )}
      >
        {escalated ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : resolved ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <OctagonAlert className="size-4" aria-hidden="true" />
        )}
        {escalated
          ? "Critical · not yet acknowledged"
          : resolved
            ? "No longer Critical"
            : "Critical reading"}
      </p>

      <p className="mt-2 text-sm font-medium text-ink">
        <span className="font-mono">{alert.patientId}</span>
        {patient ? <span className="text-ink-muted"> · {patient.name}</span> : null}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">
        <time dateTime={new Date(alert.startedAt).toISOString()}>
          {formatClock(alert.startedAt)}
        </time>
        {alert.readingCount > 1 ? ` · ${alert.readingCount} Critical readings` : null}
      </p>

      <ul className="mt-3 space-y-1">
        {alert.trigger.map((vital) => (
          <li key={vital.key} className="numeric text-sm text-ink">
            {describeVital(vital)}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onOpen} className={button({ intent: "secondary", size: "sm" })}>
          Open patient
        </button>
        {state === "open" ? (
          <button type="button" onClick={onAcknowledge} className={button({ size: "sm" })}>
            Acknowledge
          </button>
        ) : null}
      </div>
    </div>
  );
}
