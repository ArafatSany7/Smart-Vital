import { CLINICIANS, createRoster } from "@/lib/vitals/roster";
import type { Clinician, Patient, RiskLevel } from "@/lib/vitals/types";

const roster = createRoster();

export const ALL_PATIENT_IDS: readonly string[] = roster.patients.map(
  (patient) => patient.id,
);

export function getClinician(clinicianId: string | null): Clinician | null {
  return CLINICIANS.find((clinician) => clinician.id === clinicianId) ?? null;
}

export function listPatientsFor(clinicianId: string | null): Patient[] {
  if (!clinicianId) return [];
  return roster.patients.filter(
    (patient) => patient.clinicianId === clinicianId,
  );
}

export function findPatientFor(
  clinicianId: string | null,
  patientId: string,
): Patient | null {
  return (
    listPatientsFor(clinicianId).find((patient) => patient.id === patientId) ??
    null
  );
}

export function groupByRisk(patients: Patient[]): Record<RiskLevel, Patient[]> {
  const groups: Record<RiskLevel, Patient[]> = { high: [], medium: [], low: [] };
  for (const patient of patients) groups[patient.riskLevel].push(patient);
  return groups;
}
