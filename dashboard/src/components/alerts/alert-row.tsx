"use client";

import { BellRing, Check, CheckCheck, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { describeVital } from "@/components/alerts/alert-format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { alertState, type Alert } from "@/lib/vitals/alerts";
import { formatClock } from "@/lib/vitals/display";
import { useAlerts } from "@/stores/alerts";

const STATE_META = {
  open: { label: "Needs acknowledging", Icon: OctagonAlert, tone: "text-critical" },
  acknowledged: { label: "Acknowledged", Icon: CheckCheck, tone: "text-ink-muted" },
  resolved: { label: "Resolved", Icon: Check, tone: "text-ink-muted" },
} as const;

export function AlertRow({
  alert,
  clinicianName,
  showPatient = false,
  patientName,
}: {
  alert: Alert;
  clinicianName: string;
  showPatient?: boolean;
  patientName?: string;
}) {
  const acknowledge = useAlerts((state) => state.acknowledge);
  const state = alertState(alert);
  const escalated = state === "open" && alert.escalatedAt !== null;
  const meta = STATE_META[state];

  return (
    <article
      className={cn(
        "rounded-xl border p-3 transition-[background-color,border-color] duration-300 ease-out",
        state === "open" ? "border-critical-line bg-critical-soft" : "border-line bg-inset/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("flex items-center gap-1.5 text-xs font-medium", meta.tone)}>
            {escalated ? (
              <BellRing className="size-3.5" aria-hidden="true" />
            ) : (
              <meta.Icon className="size-3.5" aria-hidden="true" />
            )}
            {escalated ? "Escalated · needs acknowledging" : meta.label}
          </p>
          {showPatient ? (
            <Link
              href={`/patients/${alert.patientId}`}
              className="mt-1 block truncate text-sm font-medium text-ink hover:underline"
            >
              <span className="font-mono">{alert.patientId}</span>
              {patientName ? <span className="text-ink-muted"> · {patientName}</span> : null}
            </Link>
          ) : null}
          <p className="mt-1 text-xs text-ink-muted">
            <time dateTime={new Date(alert.startedAt).toISOString()}>{formatClock(alert.startedAt)}</time>
            {alert.readingCount > 1 ? ` · ${alert.readingCount} Critical readings` : ""}
            {alert.historical || alert.carriedOver ? " · began before you signed in" : ""}
          </p>
        </div>
        {state === "open" ? (
          <Button size="sm" onClick={() => acknowledge(alert.id, clinicianName, Date.now())}>
            Acknowledge
          </Button>
        ) : null}
      </div>
      <ul className="mt-2 space-y-0.5">
        {alert.trigger.map((vital) => (
          <li key={vital.key} className="numeric text-sm text-ink">
            {describeVital(vital)}
          </li>
        ))}
      </ul>
      {state !== "open" ? (
        <p className="mt-2 text-xs text-ink-subtle">
          {alert.acknowledgedAt !== null
            ? `Acknowledged by ${alert.acknowledgedBy} at ${formatClock(alert.acknowledgedAt)}`
            : "Not acknowledged"}
          {alert.resolvedAt !== null ? ` · resolved ${formatClock(alert.resolvedAt)}` : ""}
        </p>
      ) : null}
    </article>
  );
}
