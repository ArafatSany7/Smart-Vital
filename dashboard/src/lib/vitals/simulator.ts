import type { Rng } from "./random";
import { RISK_SCORE, type Reading, type RiskLevel } from "./types";

export interface SimulationProfile {
  patientId: string;
  riskLevel: RiskLevel;
  diabetic: boolean;
  baseHeartRate: number;
  baseSystolic: number;
}

export const DROPOUT_RATE = 0.02;

export const HEART_SHIFTS = [-22, 38] as const;
export const SYSTOLIC_SHIFTS = [-35, 55] as const;
export const GLUCOSE_SHIFTS = [-60, 150] as const;

export interface UnwellPattern {
  heartRate: number;
  systolic: number;
  glucose: number;
}

export interface ReadingOptions {
  unwellChance?: number;
  unwellRange?: [number, number];
  severity?: number;
  pattern?: UnwellPattern | null;
  noiseScale?: number;
  glucoseMean?: number;
  glucoseSd?: number;
}

export function createProfile(
  patientId: string,
  riskLevel: RiskLevel,
  diabetic: boolean,
  rng: Rng,
): SimulationProfile {
  return {
    patientId,
    riskLevel,
    diabetic,
    baseHeartRate: rng.normal(72, 7),
    baseSystolic: rng.normal(118, 9) + 6 * RISK_SCORE[riskLevel],
  };
}

const round = (value: number, places = 0) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function generateReading(
  profile: SimulationProfile,
  rng: Rng,
  timestamp: number,
  options: ReadingOptions = {},
): Reading {
  const risk = RISK_SCORE[profile.riskLevel];
  const unwellChance = options.unwellChance ?? 0.1 * risk + 0.06;
  const [mildest, worst] = options.unwellRange ?? [0.15, 1.5];
  const pattern = options.pattern ?? null;
  const noise = options.noiseScale ?? 1;

  const unwell = rng.next() < unwellChance;
  const k = Math.max(unwell ? rng.uniform(mildest, worst) : 0, options.severity ?? 0);

  const heartNoise = rng.normal(0, 6 * noise);
  const heartShift = rng.choice(HEART_SHIFTS);
  const heartRate = profile.baseHeartRate + heartNoise + k * (pattern?.heartRate ?? heartShift);

  const spo2 = Math.min(100, rng.normal(97, 1.1 * noise) - k * rng.uniform(2, 7));

  const systolicNoise = rng.normal(0, 8 * noise);
  const systolicShift = rng.choice(SYSTOLIC_SHIFTS);
  const systolic = profile.baseSystolic + systolicNoise + k * (pattern?.systolic ?? systolicShift);
  const diastolic = 0.55 * systolic + rng.normal(12, 5 * noise);

  const temperature = rng.normal(36.8, 0.3 * noise) + k * rng.uniform(0, 2.2);

  let glucose: number | null = null;
  if (profile.diabetic) {
    const glucoseBase = rng.normal(options.glucoseMean ?? 135, options.glucoseSd ?? 25);
    const glucoseShift = rng.choice(GLUCOSE_SHIFTS);
    glucose = glucoseBase + k * (pattern?.glucose ?? glucoseShift);
  }

  const orDropout = (value: number) =>
    rng.next() < DROPOUT_RATE ? null : value;

  return {
    patientId: profile.patientId,
    timestamp,
    heartRate: orDropout(round(heartRate)),
    spo2: orDropout(round(spo2, 1)),
    systolicBp: orDropout(round(systolic)),
    diastolicBp: round(diastolic),
    temperature: orDropout(round(temperature, 1)),
    glucose: glucose === null ? null : round(glucose),
  };
}
