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
import { AlertsTile } from "@/components/alerts/alerts-tile";
import { SimulateButton } from "@/components/patients/simulate-button";
import { SectionLabel } from "@/components/ui/section-label";
import { ThresholdDialog } from "@/components/thresholds/threshold-dialog";
import { Tile } from "@/components/ui/tile";
import { ReadingStatusTile } from "@/components/vitals/reading-status-tile";
import { VitalTile } from "@/components/vitals/vital-tile";
import { useCaseload } from "@/hooks/use-caseload";
import { findPatientFor } from "@/lib/data/patients";
import { formatClock, VITAL_DISPLAY } from "@/lib/vitals/display";
import { changedVitals } from "@/lib/vitals/threshold-editor";
import { RISK_LABEL } from "@/lib/vitals/types";
import { useThresholdOverride } from "@/stores/thresholds";

function CustomThresholdChip({ patientId }: { patientId: string }) {
  const override = useThresholdOverride(patientId);
  if (!override) return null;
  const changed = changedVitals(override.thresholds).map((vital) => VITAL_DISPLAY[vital].shortLabel);
  return (
    <p
      className="flex h-8 items-center rounded-full border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent"
      title={`Set by ${override.updatedBy} at ${formatClock(override.updatedAt)}`}
    >
      Custom thresholds: {changed.join(", ")}
    </p>
  );
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
      <Link href="/dashboard" className={button({ intent: "secondary", className: "mt-6" })}>
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
      <Link
        href="/dashboard"
        className="-mb-1 flex h-11 items-center gap-2 self-start rounded-xl text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:col-span-6 lg:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All patients
      </Link>
      <Tile index={0} className="md:col-span-6 xl:col-span-8">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={patient.name} size="lg" />
          <div className="min-w-0 flex-1">
            <SectionLabel index="02">Patient</SectionLabel>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-balance text-ink">
              {patient.name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              <span className="font-mono">{patient.id}</span> · {patient.age}{" "}
              years
            </p>
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            <p className="flex h-8 items-center gap-2 rounded-full border border-line bg-inset px-3 text-xs font-medium text-ink-muted">
              <RiskBars level={patient.riskLevel} />
              {RISK_LABEL[patient.riskLevel]}
            </p>
            <CustomThresholdChip patientId={patient.id} />
            <ThresholdDialog patient={patient} />
            <SimulateButton patientId={patient.id} />
          </div>
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
      <AlertsTile
        patientId={patient.id}
        index={7}
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
