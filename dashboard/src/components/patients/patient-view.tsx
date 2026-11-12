"use client";

import { ArrowLeft, UserX } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  ConditionChips,
  RiskBars,
} from "@/components/patients/patient-bits";
import { button } from "@/components/ui/button";
import { ReadingLog } from "@/components/charts/reading-log";
import { TrendsTile } from "@/components/charts/trends-tile";
import { PlaceholderTile } from "@/components/ui/placeholder-tile";
import { Tile } from "@/components/ui/tile";
import { ReadingStatusTile } from "@/components/vitals/reading-status-tile";
import { VitalTile } from "@/components/vitals/vital-tile";
import { useCaseload } from "@/hooks/use-caseload";
import { findPatientFor } from "@/lib/data/patients";
import { RISK_LABEL } from "@/lib/vitals/types";

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
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink">
              {patient.name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              <span className="font-mono">{patient.id}</span> · {patient.age}{" "}
              years
            </p>
          </div>
          <p className="ml-auto flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-inset px-3 text-xs font-medium text-ink-muted">
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
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
              Monitored vitals
            </dt>
            <dd className="mt-2">
              <ConditionChips
                conditions={[
                  "Heart rate",
                  "SpO2",
                  "Blood pressure",
                  "Temperature",
                  ...(patient.diabetic ? ["Blood glucose"] : []),
                ]}
              />
            </dd>
          </div>
        </dl>
      </Tile>
      <ReadingStatusTile
        patientId={patient.id}
        index={1}
        className="md:col-span-6 xl:col-span-4"
      />
      <VitalTile patientId={patient.id} vital="heartRate" index={2} className="md:col-span-3 xl:col-span-4" />
      <VitalTile patientId={patient.id} vital="spo2" index={3} className="md:col-span-3 xl:col-span-4" />
      <VitalTile patientId={patient.id} vital="systolicBp" index={4} className="md:col-span-3 xl:col-span-4" />
      <VitalTile patientId={patient.id} vital="temperature" index={5} className="md:col-span-3 xl:col-span-4" />
      <VitalTile
        patientId={patient.id}
        vital="glucose"
        monitored={patient.diabetic}
        index={6}
        className="md:col-span-3 xl:col-span-4"
      />
      <PlaceholderTile
        index={7}
        title="Alerts"
        note="Critical readings for this patient"
        className="md:col-span-3 xl:col-span-4"
      />
      <TrendsTile
        patientId={patient.id}
        diabetic={patient.diabetic}
        index={8}
        className="md:col-span-6 xl:col-span-12"
      />
      <ReadingLog
        patientId={patient.id}
        diabetic={patient.diabetic}
        index={9}
        className="md:col-span-6 xl:col-span-12"
      />
    </div>
  );
}
