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
): Reading {
  const risk = RISK_SCORE[profile.riskLevel];

  const unwell = rng.next() < 0.1 * risk + 0.06;
  const k = unwell ? rng.uniform(0.15, 1.5) : 0;

  const heartRate =
    profile.baseHeartRate + rng.normal(0, 6) + k * rng.choice([-22, 38]);
  const spo2 = Math.min(100, rng.normal(97, 1.1) - k * rng.uniform(2, 7));
  const systolic =
    profile.baseSystolic + rng.normal(0, 8) + k * rng.choice([-35, 55]);
  const diastolic = 0.55 * systolic + rng.normal(12, 5);
  const temperature = rng.normal(36.8, 0.3) + k * rng.uniform(0, 2.2);
  const glucose = profile.diabetic
    ? rng.normal(135, 25) + k * rng.choice([-60, 150])
    : null;

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
