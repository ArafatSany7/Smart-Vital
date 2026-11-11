import type { Reading, ScoredVitalKey, Status } from "./types";

export interface VitalLimits {
  severeLow?: number;
  mildLow?: number;
  mildHigh?: number;
  severeHigh?: number;
}

export type Thresholds = Record<ScoredVitalKey, VitalLimits>;

export const DEFAULT_THRESHOLDS: Thresholds = {
  heartRate: { severeLow: 50, mildHigh: 100, severeHigh: 120 },
  spo2: { severeLow: 91, mildLow: 94 },
  systolicBp: { severeLow: 90, mildLow: 100, mildHigh: 170, severeHigh: 200 },
  temperature: { severeLow: 35.5, mildHigh: 38, severeHigh: 39 },
  glucose: { severeLow: 70, mildHigh: 220, severeHigh: 300 },
};

export const SEVERE_POINTS: Record<ScoredVitalKey, number> = {
  heartRate: 2,
  spo2: 3,
  systolicBp: 3,
  temperature: 2,
  glucose: 3,
};

export const CRITICAL_POINTS = 3;
export const WARNING_POINTS = 1;

export const SCORED_VITALS: readonly ScoredVitalKey[] = [
  "heartRate",
  "spo2",
  "systolicBp",
  "temperature",
  "glucose",
];

export interface VitalScore {
  key: ScoredVitalKey;
  value: number | null;
  points: number;
  direction: "low" | "high" | null;
  status: Status;
}

export interface Classification {
  status: Status;
  points: number;
  vitals: VitalScore[];
}

export function statusFromPoints(points: number): Status {
  if (points >= CRITICAL_POINTS) return "critical";
  if (points >= WARNING_POINTS) return "warning";
  return "normal";
}

export function scoreVital(
  key: ScoredVitalKey,
  value: number | null,
  limits: VitalLimits = DEFAULT_THRESHOLDS[key],
): VitalScore {
  let points = 0;
  let direction: VitalScore["direction"] = null;

  if (value !== null && !Number.isNaN(value)) {
    const { severeLow, mildLow, mildHigh, severeHigh } = limits;
    if (severeLow !== undefined && value < severeLow) {
      points = SEVERE_POINTS[key];
      direction = "low";
    } else if (severeHigh !== undefined && value > severeHigh) {
      points = SEVERE_POINTS[key];
      direction = "high";
    } else if (mildLow !== undefined && value < mildLow) {
      points = 1;
      direction = "low";
    } else if (mildHigh !== undefined && value > mildHigh) {
      points = 1;
      direction = "high";
    }
  }

  return { key, value, points, direction, status: statusFromPoints(points) };
}

export function classifyReading(
  reading: Pick<Reading, ScoredVitalKey>,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Classification {
  const vitals = SCORED_VITALS.map((key) =>
    scoreVital(key, reading[key], thresholds[key]),
  );
  const points = vitals.reduce((total, vital) => total + vital.points, 0);
  return { status: statusFromPoints(points), points, vitals };
}
