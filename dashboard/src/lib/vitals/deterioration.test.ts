import { describe, expect, it } from "vitest";
import { DETERIORATION, STABLE, stepDeterioration, type Deterioration } from "./deterioration";
import { Rng } from "./random";
import type { RiskLevel } from "./types";

function spells(riskLevel: RiskLevel, ticks: number, seed = 3) {
  const rng = new Rng(seed);
  let state: Deterioration = STABLE;
  const lengths: number[] = [];
  let current = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    const startsNew = state.ticksLeft === 0;
    const step = stepDeterioration(state, riskLevel, rng);
    state = step.state;
    if (step.severity > 0 && startsNew && current > 0) {
      lengths.push(current);
      current = 0;
    }
    if (step.severity > 0) current += 1;
    else if (current > 0) {
      lengths.push(current);
      current = 0;
    }
  }
  return lengths;
}

describe("stepDeterioration", () => {
  it("produces spells of the configured length", () => {
    const lengths = spells("high", 40_000);
    expect(lengths.length).toBeGreaterThan(20);
    for (const length of lengths) {
      expect(length).toBeGreaterThanOrEqual(DETERIORATION.ticks[0]);
      expect(length).toBeLessThanOrEqual(DETERIORATION.ticks[1]);
    }
  });

  it("happens more often for higher-risk patients", () => {
    expect(spells("high", 40_000).length).toBeGreaterThan(spells("low", 40_000).length);
  });

  it("keeps the same severity for a whole spell", () => {
    const rng = new Rng(1);
    let state: Deterioration = { ticksLeft: 5, severity: 1.3 };
    for (let i = 0; i < 5; i += 1) {
      const step = stepDeterioration(state, "low", rng);
      expect(step.severity).toBe(1.3);
      state = step.state;
    }
    expect(state.ticksLeft).toBe(0);
  });
});
