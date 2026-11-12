import type { Rng } from "./random";
import type { RiskLevel } from "./types";

export const DETERIORATION = {
  startChance: { low: 0.002, medium: 0.004, high: 0.01 } satisfies Record<RiskLevel, number>,
  ticks: [12, 30] as [number, number],
  severity: [1.2, 1.6] as [number, number],
};

export interface Deterioration {
  ticksLeft: number;
  severity: number;
}

export const STABLE: Deterioration = { ticksLeft: 0, severity: 0 };

export function stepDeterioration(
  state: Deterioration,
  riskLevel: RiskLevel,
  rng: Rng,
): { state: Deterioration; severity: number } {
  if (state.ticksLeft > 0) {
    return {
      state: { ...state, ticksLeft: state.ticksLeft - 1 },
      severity: state.severity,
    };
  }
  if (rng.next() < DETERIORATION.startChance[riskLevel]) {
    const severity = rng.uniform(...DETERIORATION.severity);
    return {
      state: { ticksLeft: rng.int(...DETERIORATION.ticks) - 1, severity },
      severity,
    };
  }
  return { state: STABLE, severity: 0 };
}
