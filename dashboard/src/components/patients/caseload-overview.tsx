"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Avatar,
  ConditionChips,
  RiskBars,
} from "@/components/patients/patient-bits";
import { MetricNumber } from "@/components/ui/metric-number";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge, StatusDot } from "@/components/ui/status";
import { Tile } from "@/components/ui/tile";
import { Tilt } from "@/components/ui/tilt";
import { useCaseload } from "@/hooks/use-caseload";
import { useFeedClock } from "@/hooks/use-now";
import { usePatientFeed } from "@/hooks/use-patient-feed";
import { cn } from "@/lib/cn";
import { formatValue } from "@/lib/vitals/display";
import { feedHealth } from "@/lib/vitals/feed";
import { RISK_LABEL, RISK_ORDER, type Patient, type Status } from "@/lib/vitals/types";
import { FEED_INTERVAL_MS, useFeed } from "@/stores/feed";

function Stat({
  index,
  label,
  value,
  note,
  tone,
  className,
}: {
  index: number;
  label: string;
  value: number;
  note?: string;
  tone?: Status;
  className?: string;
}) {
  const active = tone !== undefined && tone !== "normal" && value > 0;
  return (
    <Tile
      index={index}
      className={cn(
        "transition-[background-color,border-color] duration-300 ease-out",
        "transition-[background-color,border-color,box-shadow]",
        active && tone === "critical" && "tile-glow-critical critical-ring border-critical-line bg-critical-soft",
        active && tone === "warning" && "tile-glow-warning border-warning-line bg-warning-soft",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        {tone ? (
          <StatusDot status={tone} muted={!active} />
        ) : null}
        {label}
      </p>
      <p className="mt-2 text-4xl font-semibold">
        <MetricNumber value={value} status={active ? tone : undefined} />
      </p>
      {note ? <p className="mt-1 text-xs text-ink-muted">{note}</p> : null}
    </Tile>
  );
}

function useCaseloadNow(patients: Patient[]) {
  const feeds = useFeed((state) => state.patients);
  const paused = useFeed((state) => !state.running);
  const now = useFeedClock();
  const counts = { critical: 0, warning: 0, issues: 0 };
  for (const patient of patients) {
    const feed = feeds[patient.id];
    const health = feedHealth(feed, now, FEED_INTERVAL_MS);
    if (!paused && (health === "delayed" || health === "offline")) {
      counts.issues += 1;
      continue;
    }
    const status = feed?.classification?.status;
    if (status === "critical") counts.critical += 1;
    if (status === "warning") counts.warning += 1;
  }
  return counts;
}

function MiniVital({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-ink-subtle uppercase">
        {label}
      </dt>
      <dd className="numeric mt-0.5 truncate text-sm font-medium text-ink">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function PatientLive({ patientId }: { patientId: string }) {
  const { feed, health, paused } = usePatientFeed(patientId);
  const latest = feed?.latest;
  const status = feed?.classification?.status ?? "normal";
  const stale = !paused && (health === "delayed" || health === "offline");

  const heartRate = latest?.heartRate;
  const spo2 = latest?.spo2;
  const systolic = latest?.systolicBp;
  const diastolic = latest?.diastolicBp;

  return (
    <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
      <dl className={cn("grid flex-1 grid-cols-3 gap-2", stale && "opacity-50")}>
        <MiniVital label="HR" value={heartRate == null ? null : formatValue(heartRate, 0)} />
        <MiniVital label="SpO2" value={spo2 == null ? null : `${formatValue(spo2, 1)}%`} />
        <MiniVital
          label="BP"
          value={systolic == null ? null : `${systolic}/${diastolic ?? "—"}`}
        />
      </dl>
      {latest ? (
        stale ? (
          <span className="text-xs font-medium text-warning">
            {health === "offline" ? "Offline" : "Delayed"}
          </span>
        ) : (
          <StatusBadge status={status} />
        )
      ) : null}
    </div>
  );
}

function useCardTone(patientId: string): string {
  const { feed, health, paused } = usePatientFeed(patientId);
  if (!paused && (health === "delayed" || health === "offline")) return "";
  const status = feed?.classification?.status;
  if (status === "critical") return "tile-glow-critical critical-ring border-critical-line";
  if (status === "warning") return "tile-glow-warning border-warning-line";
  return "";
}

function PatientCard({ patient, index }: { patient: Patient; index: number }) {
  const tone = useCardTone(patient.id);
  return (
    <Tilt>
      <Link
        href={`/patients/${patient.id}`}
        style={{ "--i": Math.min(index, 8) } as CSSProperties}
        className={cn(
          "glass tile-enter flex h-full flex-col gap-4 rounded-tile border border-line p-4 hover:-translate-y-0.5 hover:shadow-pop",
          "transition-[transform,translate,scale,border-color,box-shadow] duration-150 ease-out-strong",
          "hover:border-accent/40 active:scale-[0.98]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          tone,
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-ink">
              {patient.name}
            </p>
            <p className="text-xs text-ink-subtle">
              <span className="font-mono">{patient.id}</span> · {patient.age}{" "}
              years
            </p>
          </div>
          <RiskBars level={patient.riskLevel} />
        </div>
        <ConditionChips conditions={patient.conditions} />
        <PatientLive patientId={patient.id} />
      </Link>
    </Tilt>
  );
}

export function CaseloadOverview() {
  const { clinician, patients, groups } = useCaseload();
  const counts = useCaseloadNow(patients);
  if (!clinician) return null;

  return (
    <div className="space-y-8">
      <header className="tile-enter">
        <SectionLabel index="01">Caseload</SectionLabel>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          Your patients
        </h1>
        <p className="mt-3 max-w-xl text-base text-ink-muted">
          {patients.length} patients are assigned to {clinician.name}. You see
          only these.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          index={0}
          label="Assigned to you"
          value={patients.length}
          note={`${groups.high.length} high · ${groups.medium.length} medium · ${groups.low.length} low risk`}
        />
        <Stat
          index={1}
          label="Critical now"
          value={counts.critical}
          tone="critical"
          note="Latest reading is Critical"
        />
        <Stat
          index={2}
          label="Warning now"
          value={counts.warning}
          tone="warning"
          note="Latest reading is Warning"
        />
        <Stat
          index={3}
          label="Feed problems"
          value={counts.issues}
          tone="warning"
          note="No reading for over 7 seconds"
        />
      </div>
      {RISK_ORDER.map((level) =>
        groups[level].length === 0 ? null : (
          <section key={level} aria-labelledby={`group-${level}`}>
            <h2
              id={`group-${level}`}
              className="flex items-center gap-2 text-sm font-medium text-ink"
            >
              <RiskBars level={level} />
              {RISK_LABEL[level]}
              <span className="numeric font-normal text-ink-subtle">
                {groups[level].length}
              </span>
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {groups[level].map((patient, index) => (
                <PatientCard key={patient.id} patient={patient} index={index} />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
