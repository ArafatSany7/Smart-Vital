import { describe, expect, it } from "vitest";
import { Rng } from "./random";
import { classifyReading } from "./rules";
import {
  createProfile,
  DROPOUT_RATE,
  generateReading,
  type SimulationProfile,
} from "./simulator";
import type { Reading, RiskLevel } from "./types";

function profileFor(riskLevel: RiskLevel, diabetic = false): SimulationProfile {
  return createProfile("P999", riskLevel, diabetic, new Rng(7));
}

function manyReadings(profile: SimulationProfile, count: number, seed = 1) {
  const rng = new Rng(seed);
  return Array.from({ length: count }, (_, index) =>
    generateReading(profile, rng, index * 60_000),
  );
}

const share = (readings: Reading[], test: (reading: Reading) => boolean) =>
  readings.filter(test).length / readings.length;

describe("generateReading", () => {
  it("is repeatable: the same seed gives the same readings", () => {
    const profile = profileFor("medium", true);
    expect(manyReadings(profile, 50, 3)).toEqual(manyReadings(profile, 50, 3));
  });

  it("keeps the patient ID and timestamp it was given", () => {
    const reading = generateReading(profileFor("low"), new Rng(1), 1234);
    expect(reading.patientId).toBe("P999");
    expect(reading.timestamp).toBe(1234);
  });

  it("only produces glucose for patients with diabetes", () => {
    const without = manyReadings(profileFor("high", false), 200);
    const withDiabetes = manyReadings(profileFor("high", true), 200);
    expect(without.every((reading) => reading.glucose === null)).toBe(true);
    expect(withDiabetes.every((reading) => reading.glucose !== null)).toBe(
      true,
    );
  });

  it("never reports SpO2 above 100%", () => {
    const readings = manyReadings(profileFor("low"), 5000);
    expect(readings.every((r) => r.spo2 === null || r.spo2 <= 100)).toBe(true);
  });

  it("rounds like the notebook: whole numbers, one decimal for SpO2 and temperature", () => {
    const tenths = (value: number) => Number.isInteger(Math.round(value * 1e6) / 1e5);
    for (const reading of manyReadings(profileFor("medium", true), 500)) {
      if (reading.heartRate !== null) expect(Number.isInteger(reading.heartRate)).toBe(true);
      if (reading.systolicBp !== null) expect(Number.isInteger(reading.systolicBp)).toBe(true);
      if (reading.diastolicBp !== null) expect(Number.isInteger(reading.diastolicBp)).toBe(true);
      if (reading.glucose !== null) expect(Number.isInteger(reading.glucose)).toBe(true);
      if (reading.spo2 !== null) expect(tenths(reading.spo2)).toBe(true);
      if (reading.temperature !== null) expect(tenths(reading.temperature)).toBe(true);
    }
  });

  it("drops out each sensor about 2% of the time", () => {
    const readings = manyReadings(profileFor("low"), 20_000);
    for (const key of ["heartRate", "spo2", "systolicBp", "temperature"] as const) {
      const rate = share(readings, (reading) => reading[key] === null);
      expect(rate).toBeGreaterThan(DROPOUT_RATE - 0.006);
      expect(rate).toBeLessThan(DROPOUT_RATE + 0.006);
    }
  });

  it("makes higher-risk patients unwell more often", () => {
    const abnormalShare = (riskLevel: RiskLevel) =>
      share(
        manyReadings(profileFor(riskLevel), 8000),
        (reading) => classifyReading(reading).status !== "normal",
      );

    const low = abnormalShare("low");
    const medium = abnormalShare("medium");
    const high = abnormalShare("high");
    expect(medium).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(medium);
  });

  it("keeps a patient unwell for a whole deterioration spell", () => {
    const rng = new Rng(4);
    const profile = profileFor("medium");
    const readings = Array.from({ length: 200 }, (_, index) =>
      generateReading(profile, rng, index * 60_000, 1.4),
    );
    expect(share(readings, (r) => classifyReading(r).status === "critical")).toBeGreaterThan(0.6);
  });

  it("matches the notebook's distribution when no severity is given", () => {
    const profile = profileFor("low");
    expect(manyReadings(profile, 300, 8)).toEqual(
      (() => {
        const rng = new Rng(8);
        return Array.from({ length: 300 }, (_, index) =>
          generateReading(profile, rng, index * 60_000, 0),
        );
      })(),
    );
  });

  it("produces all three statuses, with Critical the rarest", () => {
    const readings = manyReadings(profileFor("high", true), 8000);
    const statusShare = (status: string) =>
      share(readings, (reading) => classifyReading(reading).status === status);

    expect(statusShare("normal")).toBeGreaterThan(0.4);
    expect(statusShare("warning")).toBeGreaterThan(0.02);
    expect(statusShare("critical")).toBeGreaterThan(0.02);
    expect(statusShare("critical")).toBeLessThan(statusShare("normal"));
  });
});
