import { DEFAULT_THRESHOLDS, type Thresholds, type VitalLimits } from "./rules";
import type { ScoredVitalKey } from "./types";

export const LIMIT_ORDER = ["severeLow", "mildLow", "mildHigh", "severeHigh"] as const;
export type LimitKey = (typeof LIMIT_ORDER)[number];

export const LIMIT_LABEL: Record<LimitKey, string> = {
  severeLow: "Severe low",
  mildLow: "Low",
  mildHigh: "High",
  severeHigh: "Severe high",
};

export const SLIDER_RANGE: Record<ScoredVitalKey, { min: number; max: number; step: number }> = {
  heartRate: { min: 20, max: 200, step: 1 },
  spo2: { min: 70, max: 100, step: 0.5 },
  systolicBp: { min: 60, max: 240, step: 1 },
  temperature: { min: 33, max: 42, step: 0.1 },
  glucose: { min: 30, max: 450, step: 5 },
};

export function limitKeys(vital: ScoredVitalKey): LimitKey[] {
  return LIMIT_ORDER.filter((key) => DEFAULT_THRESHOLDS[vital][key] !== undefined);
}

export function toSliderValues(vital: ScoredVitalKey, limits: VitalLimits): number[] {
  return limitKeys(vital).map((key) => limits[key] as number);
}

function roundToStep(value: number, step: number): number {
  const decimals = step < 1 ? String(step).split(".")[1].length : 0;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

export function fromSliderValues(vital: ScoredVitalKey, values: number[]): VitalLimits {
  const { step } = SLIDER_RANGE[vital];
  const sorted = [...values].sort((a, b) => a - b);
  const limits: VitalLimits = {};
  limitKeys(vital).forEach((key, index) => {
    limits[key] = roundToStep(sorted[index], step);
  });
  return limits;
}

export function isValidLimits(vital: ScoredVitalKey, limits: VitalLimits): boolean {
  const { min, max } = SLIDER_RANGE[vital];
  const values = toSliderValues(vital, limits);
  return values.every(
    (value, index) =>
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (index === 0 || value > values[index - 1]),
  );
}

export function sameLimits(a: VitalLimits, b: VitalLimits): boolean {
  return LIMIT_ORDER.every((key) => a[key] === b[key]);
}

export function isDefaultThresholds(thresholds: Thresholds): boolean {
  return (Object.keys(DEFAULT_THRESHOLDS) as ScoredVitalKey[]).every((vital) =>
    sameLimits(thresholds[vital], DEFAULT_THRESHOLDS[vital]),
  );
}

export function changedVitals(thresholds: Thresholds): ScoredVitalKey[] {
  return (Object.keys(DEFAULT_THRESHOLDS) as ScoredVitalKey[]).filter(
    (vital) => !sameLimits(thresholds[vital], DEFAULT_THRESHOLDS[vital]),
  );
}
