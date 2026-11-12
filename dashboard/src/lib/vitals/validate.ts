import type { Reading, VitalKey } from "./types";

export const PLAUSIBLE_RANGE: Record<VitalKey, [number, number]> = {
  heartRate: [20, 250],
  spo2: [50, 100],
  systolicBp: [50, 260],
  diastolicBp: [20, 160],
  temperature: [30, 43],
  glucose: [20, 600],
};

export const VITAL_KEYS: readonly VitalKey[] = [
  "heartRate",
  "spo2",
  "systolicBp",
  "diastolicBp",
  "temperature",
  "glucose",
];

export interface ValidatedReading {
  reading: Reading;
  rejected: VitalKey[];
}

export function isPlausible(key: VitalKey, value: number): boolean {
  const [min, max] = PLAUSIBLE_RANGE[key];
  return Number.isFinite(value) && value >= min && value <= max;
}

export function validateReading(reading: Reading): ValidatedReading {
  const cleaned: Reading = { ...reading };
  const rejected: VitalKey[] = [];

  for (const key of VITAL_KEYS) {
    const value = reading[key];
    if (value === null) continue;
    if (!isPlausible(key, value)) {
      cleaned[key] = null;
      rejected.push(key);
    }
  }

  if (cleaned.systolicBp === null && cleaned.diastolicBp !== null && rejected.includes("systolicBp")) {
    cleaned.diastolicBp = null;
  }

  return { reading: cleaned, rejected };
}
