import type { Rng } from "./random";
import {
  GLUCOSE_SHIFTS,
  HEART_SHIFTS,
  SYSTOLIC_SHIFTS,
  type ReadingOptions,
  type UnwellPattern,
} from "./simulator";
import type { RiskLevel } from "./types";

export const SCENARIO = {
  blipChance: { low: 0.004, medium: 0.007, high: 0.012 } satisfies Record<RiskLevel, number>,
  blipRange: [0.15, 0.7] as [number, number],
  spellChance: { low: 0.0003, medium: 0.0007, high: 0.0015 } satisfies Record<RiskLevel, number>,
  spellTicks: [15, 35] as [number, number],
  spellPeak: [1.2, 1.6] as [number, number],
  rampUpTicks: 5,
  rampDownTicks: 3,
  noiseScale: 0.5,
  glucoseMean: [135, 18] as [number, number],
  glucoseMeanLimits: [105, 185] as [number, number],
  glucoseSd: 8,
  demoSpellTicks: 30,
};

export interface Deterioration {
  ticksLeft: number;
  totalTicks: number;
  peak: number;
  pattern: UnwellPattern | null;
}

export const STABLE: Deterioration = { ticksLeft: 0, totalTicks: 0, peak: 0, pattern: null };

export function startSpell(rng: Rng, ticks?: number): Deterioration {
  const totalTicks = ticks ?? rng.int(...SCENARIO.spellTicks);
  return {
    ticksLeft: totalTicks,
    totalTicks,
    peak: rng.uniform(...SCENARIO.spellPeak),
    pattern: {
      heartRate: rng.choice(HEART_SHIFTS),
      systolic: rng.choice(SYSTOLIC_SHIFTS),
      glucose: rng.choice(GLUCOSE_SHIFTS),
    },
  };
}

export function extendOrStart(state: Deterioration, rng: Rng, ticks: number): Deterioration {
  if (state.ticksLeft <= 0) return startSpell(rng, ticks);
  const extra = Math.max(0, ticks - state.ticksLeft);
  return { ...state, ticksLeft: state.ticksLeft + extra, totalTicks: state.totalTicks + extra };
}

export function severityAt(state: Deterioration): number {
  if (state.ticksLeft <= 0) return 0;
  const elapsed = state.totalTicks - state.ticksLeft;
  const rise = (elapsed + 1) / SCENARIO.rampUpTicks;
  const fall = state.ticksLeft / SCENARIO.rampDownTicks;
  return state.peak * Math.min(1, rise, fall);
}

export function stepDeterioration(
  state: Deterioration,
  riskLevel: RiskLevel,
  rng: Rng,
): { state: Deterioration; severity: number; pattern: UnwellPattern | null } {
  let current = state;
  if (current.ticksLeft <= 0) {
    if (rng.next() >= SCENARIO.spellChance[riskLevel]) {
      return { state: STABLE, severity: 0, pattern: null };
    }
    current = startSpell(rng);
  }
  return {
    state: { ...current, ticksLeft: current.ticksLeft - 1 },
    severity: severityAt(current),
    pattern: current.pattern,
  };
}

export function personalGlucose(rng: Rng): number {
  const [low, high] = SCENARIO.glucoseMeanLimits;
  return Math.min(high, Math.max(low, rng.normal(...SCENARIO.glucoseMean)));
}

export function calmOptions(
  riskLevel: RiskLevel,
  severity: number,
  pattern: UnwellPattern | null,
  glucoseMean = SCENARIO.glucoseMean[0],
): ReadingOptions {
  return {
    unwellChance: SCENARIO.blipChance[riskLevel],
    unwellRange: SCENARIO.blipRange,
    severity,
    pattern,
    noiseScale: SCENARIO.noiseScale,
    glucoseMean,
    glucoseSd: SCENARIO.glucoseSd,
  };
}
