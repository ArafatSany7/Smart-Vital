"use client";

import { Download } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { Tile } from "@/components/ui/tile";
import { usePatientFeed } from "@/hooks/use-patient-feed";
import { cn } from "@/lib/cn";
import { formatClock, formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import type { HistoryEntry } from "@/lib/vitals/feed";
import type { ScoredVitalKey, VitalKey } from "@/lib/vitals/types";

const PAGE = 40;

const cellTone = {
  normal: "",
  warning: "bg-warning-soft font-medium text-warning",
  critical: "bg-critical-soft font-medium text-critical",
};

function notesFor(entry: HistoryEntry, columns: ScoredVitalKey[]): string[] {
  const notes: string[] = [];
  if (entry.late) notes.push("Arrived late");
  if (entry.rejected.length > 0) {
    notes.push(`Rejected ${entry.rejected.map((key) => labelFor(key)).join(", ")}`);
  }
  const missing = columns.filter(
    (key) => entry.reading[key] === null && !entry.rejected.includes(key),
  );
  if (missing.length > 0) notes.push(`No signal: ${missing.map((key) => labelFor(key)).join(", ")}`);
  return notes;
}

function labelFor(key: VitalKey): string {
  if (key === "diastolicBp") return "Diastolic";
  return VITAL_DISPLAY[key].shortLabel;
}

function toCsv(entries: HistoryEntry[], columns: ScoredVitalKey[]): string {
  const header = ["timestamp_iso", "patient_id", "heart_rate", "spo2", "systolic_bp", "diastolic_bp", "temperature", "glucose", "status", "points", "notes"];
  const rows = entries.map((entry) => {
    const r = entry.reading;
    return [
      new Date(r.timestamp).toISOString(),
      r.patientId,
      r.heartRate,
      r.spo2,
      r.systolicBp,
      r.diastolicBp,
      r.temperature,
      r.glucose,
      entry.status,
      entry.points,
      `"${notesFor(entry, columns).join("; ")}"`,
    ]
      .map((value) => (value === null ? "" : String(value)))
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 bg-surface px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-subtle",
        className,
      )}
    >
      {children}
    </th>
  );
}

function ValueCell({ entry, vital }: { entry: HistoryEntry; vital: ScoredVitalKey }) {
  const value = entry.reading[vital];
  const display = VITAL_DISPLAY[vital];
  if (value === null) {
    return <td className="px-3 py-2 text-right text-ink-subtle">—</td>;
  }
  const status = entry.scores[vital] ?? "normal";
  return (
    <td className={cn("numeric px-3 py-2 text-right whitespace-nowrap text-ink", cellTone[status])}>
      {formatValue(value, display.decimals)}
      {vital === "systolicBp" ? (
        <span className="text-ink-muted">/{entry.reading.diastolicBp ?? "—"}</span>
      ) : null}
    </td>
  );
}

export function ReadingLog({
  patientId,
  diabetic,
  index,
  className,
}: {
  patientId: string;
  diabetic: boolean;
  index: number;
  className?: string;
}) {
  const { feed } = usePatientFeed(patientId);
  const [shown, setShown] = useState(PAGE);
  const history = feed?.history ?? [];
  const columns: ScoredVitalKey[] = ["heartRate", "spo2", "systolicBp", "temperature", ...(diabetic ? (["glucose"] as const) : [])];
  const newestFirst = [...history].reverse();
  const visible = newestFirst.slice(0, shown);

  function download() {
    const blob = new Blob([toCsv(history, columns)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${patientId}-readings.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Tile index={index} className={cn("flex flex-col", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Reading history</h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Newest first · {history.length} readings stored for this patient
          </p>
        </div>
        <Button intent="secondary" size="sm" onClick={download} disabled={history.length === 0}>
          <Download className="size-4" aria-hidden="true" />
          Download CSV
        </Button>
      </header>

      <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Every reading received for this patient, newest first, with its status.
          </caption>
          <thead className="border-b border-line">
            <tr>
              <Th>Time</Th>
              {columns.map((key) => (
                <Th key={key} className="text-right">
                  {VITAL_DISPLAY[key].shortLabel}{" "}
                  <span className="font-normal">{VITAL_DISPLAY[key].unit}</span>
                </Th>
              ))}
              <Th>Status</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const notes = notesFor(entry, columns);
              return (
                <tr key={entry.reading.timestamp} className="log-row border-b border-line last:border-b-0">
                  <td className="numeric px-3 py-2 whitespace-nowrap text-ink-muted">
                    {formatClock(entry.reading.timestamp)}
                  </td>
                  {columns.map((key) => (
                    <ValueCell key={key} entry={entry} vital={key} />
                  ))}
                  <td className="px-3 py-1.5">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="min-w-48 px-3 py-2 text-xs text-ink-muted">
                    {notes.length > 0 ? notes.join(" · ") : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shown < newestFirst.length ? (
        <div className="mt-3 flex justify-center">
          <Button intent="ghost" size="sm" onClick={() => setShown((count) => count + PAGE)}>
            Show {Math.min(PAGE, newestFirst.length - shown)} older readings
          </Button>
        </div>
      ) : null}
    </Tile>
  );
}
