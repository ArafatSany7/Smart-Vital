import { describe, expect, it } from "vitest";
import {
  calmOptions,
  extendOrStart,
  SCENARIO,
  severityAt,
  STABLE,
  startSpell,
  stepDeterioration,
  type Deterioration,
} from "./deterioration";
import { Rng } from "./random";
import { classifyReading } from "./rules";
import { createProfile, generateReading } from "./simulator";
import type { RiskLevel, Status } from "./types";

function spellCount(riskLevel: RiskLevel, ticks: number, seed = 3): number {
  const rng = new Rng(seed);
  let state: Deterioration = STABLE;
  let count = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    const wasStable = state.ticksLeft === 0;
    const step = stepDeterioration(state, riskLevel, rng);
    if (wasStable && step.severity > 0) count += 1;
    state = step.state;
  }
  return count;
}

function runSpell(seed: number) {
  const rng = new Rng(seed);
  let state = startSpell(rng);
  const total = state.totalTicks;
  const severities: number[] = [];
  const patterns = new Set<string>();
  while (state.ticksLeft > 0) {
    const step = stepDeterioration(state, "low", rng);
    severities.push(step.severity);
    patterns.add(JSON.stringify(step.pattern));
    state = step.state;
  }
  return { total, severities, patterns };
}

describe("deterioration spells", () => {
  it("last as long as configured", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const { total, severities } = runSpell(seed);
      expect(severities).toHaveLength(total);
      expect(total).toBeGreaterThanOrEqual(SCENARIO.spellTicks[0]);
      expect(total).toBeLessThanOrEqual(SCENARIO.spellTicks[1]);
    }
  });

  it("build up gradually, hold at the peak, then ease off", () => {
    const { severities } = runSpell(5);
    const peak = Math.max(...severities);
    expect(severities[0]).toBeLessThan(peak * 0.3);
    expect(severities[1]).toBeGreaterThan(severities[0]);
    expect(severities[SCENARIO.rampUpTicks]).toBeCloseTo(peak);
    expect(severities.at(-1)).toBeLessThan(peak * 0.5);
    expect(peak).toBeGreaterThanOrEqual(SCENARIO.spellPeak[0]);
    expect(peak).toBeLessThanOrEqual(SCENARIO.spellPeak[1]);
  });

  it("keep each vital moving in one direction for the whole spell", () => {
    expect(runSpell(7).patterns.size).toBe(1);
  });

  it("are rare, and rarer for lower-risk patients", () => {
    const high = spellCount("high", 200_000);
    const low = spellCount("low", 200_000);
    expect(high).toBeGreaterThan(low);
    expect(high / 200_000).toBeLessThan(0.002);
  });

  it("extend a running spell without changing its direction or restarting the build-up", () => {
    const rng = new Rng(4);
    let state = startSpell(rng, 20);
    for (let i = 0; i < 12; i += 1) state = stepDeterioration(state, "low", rng).state;
    const before = severityAt(state);
    const extended = extendOrStart(state, rng, 30);
    expect(extended.pattern).toEqual(state.pattern);
    expect(extended.peak).toBe(state.peak);
    expect(extended.ticksLeft).toBe(30);
    expect(severityAt(extended)).toBeGreaterThanOrEqual(before);
  });

  it("start a fresh spell when the patient is stable", () => {
    const started = extendOrStart(STABLE, new Rng(4), 30);
    expect(started.ticksLeft).toBe(30);
    expect(started.pattern).not.toBeNull();
  });

  it("shift every vital the same way for the whole spell", () => {
    const profile = createProfile("P502", "low", true, new Rng(2));
    const rng = new Rng(31);
    const courseRng = new Rng(32);
    let state = startSpell(courseRng, 30);
    const pattern = state.pattern!;
    let agree = 0;
    let total = 0;
    while (state.ticksLeft > 0) {
      const step = stepDeterioration(state, "low", courseRng);
      state = step.state;
      if (step.severity < 1) continue;
      const reading = generateReading(profile, rng, 0, calmOptions("low", step.severity, step.pattern));
      if (reading.heartRate === null) continue;
      total += 1;
      if (Math.sign(reading.heartRate - profile.baseHeartRate) === Math.sign(pattern.heartRate)) agree += 1;
    }
    expect(total).toBeGreaterThan(10);
    expect(agree).toBe(total);
  });

  it("report no severity while a patient is stable", () => {
    expect(severityAt(STABLE)).toBe(0);
  });
});

describe("calm simulation", () => {
  function statusShares(riskLevel: RiskLevel) {
    const rng = new Rng(11);
    const profile = createProfile("P500", riskLevel, true, new Rng(2));
    const counts: Record<Status, number> = { normal: 0, warning: 0, critical: 0 };
    const total = 20_000;
    for (let i = 0; i < total; i += 1) {
      const reading = generateReading(profile, rng, i * 3000, calmOptions(riskLevel, 0, null));
      counts[classifyReading(reading).status] += 1;
    }
    return {
      normal: counts.normal / total,
      warning: counts.warning / total,
      critical: counts.critical / total,
    };
  }

  it("keeps a stable patient Normal almost all the time", () => {
    for (const level of ["low", "medium", "high"] as const) {
      const shares = statusShares(level);
      expect(shares.normal, level).toBeGreaterThan(0.9);
      expect(shares.critical, level).toBeLessThan(0.01);
    }
  });

  it("turns Critical during a spell at its peak", () => {
    const rng = new Rng(21);
    const profile = createProfile("P501", "medium", false, new Rng(2));
    const pattern = { heartRate: 38, systolic: 55, glucose: 150 };
    let critical = 0;
    for (let i = 0; i < 2000; i += 1) {
      const reading = generateReading(profile, rng, i * 3000, calmOptions("medium", 1.4, pattern));
      if (classifyReading(reading).status === "critical") critical += 1;
    }
    expect(critical / 2000).toBeGreaterThan(0.7);
  });
});
