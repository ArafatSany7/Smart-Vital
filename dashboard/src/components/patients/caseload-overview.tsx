"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Avatar,
  ConditionChips,
  RiskBars,
} from "@/components/patients/patient-bits";
import { Tile } from "@/components/ui/tile";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { RISK_LABEL, RISK_ORDER, type Patient } from "@/lib/vitals/types";

function Stat({
  index,
  label,
  value,
  className,
}: {
  index: number;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Tile index={index} className={className}>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="numeric mt-2 text-4xl font-medium text-ink">{value}</p>
    </Tile>
  );
}

function PatientCard({ patient, index }: { patient: Patient; index: number }) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
      className={cn(
        "tile-enter flex flex-col gap-4 rounded-tile border border-line bg-surface p-4 shadow-tile",
        "transition-[transform,border-color] duration-150 ease-out-strong",
        "hover:border-line-strong active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
    </Link>
  );
}

export function CaseloadOverview() {
  const { clinician, patients, groups } = useCaseload();
  if (!clinician) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Your patients
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {patients.length} patients are assigned to {clinician.name}. You see
          only these.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat index={0} label="Assigned to you" value={patients.length} />
        {RISK_ORDER.map((level, position) => (
          <Stat
            key={level}
            index={position + 1}
            label={RISK_LABEL[level]}
            value={groups[level].length}
          />
        ))}
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
