export type RiskLevel = "low" | "medium" | "high";

export type Status = "normal" | "warning" | "critical";

export type ScoredVitalKey =
  | "heartRate"
  | "spo2"
  | "systolicBp"
  | "temperature"
  | "glucose";

export type VitalKey = ScoredVitalKey | "diastolicBp";

export interface Reading {
  patientId: string;
  timestamp: number;
  heartRate: number | null;
  spo2: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  temperature: number | null;
  glucose: number | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  riskLevel: RiskLevel;
  diabetic: boolean;
  conditions: string[];
  clinicianId: string;
}

export interface Clinician {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const RISK_ORDER: readonly RiskLevel[] = ["high", "medium", "low"];

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

export const RISK_SCORE: Record<RiskLevel, 1 | 2 | 3> = {
  low: 1,
  medium: 2,
  high: 3,
};
