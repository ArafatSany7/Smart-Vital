"use client";

import { ArrowLeft, Check, Minus, UserX } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  ConditionChips,
  RiskBars,
} from "@/components/patients/patient-bits";
import { button } from "@/components/ui/button";
import { PlaceholderTile } from "@/components/ui/placeholder-tile";
import { Tile, TileHeader } from "@/components/ui/tile";
import { useCaseload } from "@/hooks/use-caseload";
import { findPatientFor } from "@/lib/data/patients";
import { RISK_LABEL, type Patient } from "@/lib/vitals/types";

function monitoredVitals(patient: Patient) {
  return [
    { label: "Heart rate", unit: "bpm", monitored: true },
    { label: "Blood oxygen (SpO2)", unit: "%", monitored: true },
    { label: "Blood pressure", unit: "mmHg", monitored: true },
    { label: "Body temperature", unit: "°C", monitored: true },
    { label: "Blood glucose", unit: "mg/dL", monitored: patient.diabetic },
  ];
}

function PatientUnavailable() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface text-ink-muted">
        <UserX className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
        This patient is not on your list
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        You can only open patients who are assigned to you. Check the patient
        ID, or go back to your own patients.
      </p>
      <Link href="/" className={button({ intent: "secondary", className: "mt-6" })}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to your patients
      </Link>
    </div>
  );
}

export function PatientView({ patientId }: { patientId: string }) {
  const { clinician } = useCaseload();
  if (!clinician) return null;

  const patient = findPatientFor(clinician.id, patientId);
  if (!patient) return <PatientUnavailable />;

  return (
    <div
      key={patient.id}
      className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12"
    >
      <Tile index={0} className="md:col-span-6 xl:col-span-8">
        <div className="flex items-start gap-4">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {patient.name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              <span className="font-mono">{patient.id}</span> · {patient.age}{" "}
              years
            </p>
          </div>
          <p className="flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-inset px-3 text-xs font-medium text-ink-muted">
            <RiskBars level={patient.riskLevel} />
            {RISK_LABEL[patient.riskLevel]}
          </p>
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
              Chronic conditions
            </dt>
            <dd className="mt-2">
              <ConditionChips conditions={patient.conditions} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
              Assigned clinician
            </dt>
            <dd className="mt-2 text-sm text-ink">
              {clinician.name}
              <span className="block text-xs text-ink-muted">
                {clinician.role}
              </span>
            </dd>
          </div>
        </dl>
      </Tile>
      <Tile index={1} className="md:col-span-6 xl:col-span-4">
        <TileHeader title="Monitored vitals" />
        <ul className="mt-3 space-y-2.5">
          {monitoredVitals(patient).map((vital) => (
            <li
              key={vital.label}
              className="flex items-center gap-2.5 text-sm"
            >
              {vital.monitored ? (
                <Check className="size-4 text-accent" aria-hidden="true" />
              ) : (
                <Minus className="size-4 text-ink-subtle" aria-hidden="true" />
              )}
              <span className={vital.monitored ? "text-ink" : "text-ink-subtle"}>
                {vital.label}
              </span>
              <span className="ml-auto text-xs text-ink-subtle">
                {vital.monitored ? vital.unit : "Not monitored"}
              </span>
            </li>
          ))}
        </ul>
      </Tile>
      <PlaceholderTile
        index={2}
        title="Live vitals"
        note="Readings from this patient's sensors"
        className="md:col-span-6 xl:col-span-8"
      />
      <PlaceholderTile
        index={3}
        title="Alerts"
        note="Critical readings for this patient"
        className="md:col-span-6 xl:col-span-4"
      />
      <PlaceholderTile
        index={4}
        title="Trends"
        note="Each vital over time"
        className="md:col-span-6 xl:col-span-12"
      />
    </div>
  );
}
