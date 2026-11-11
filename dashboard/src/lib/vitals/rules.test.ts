import { describe, expect, it } from "vitest";
import {
  classifyReading,
  DEFAULT_THRESHOLDS,
  scoreVital,
  statusFromPoints,
} from "./rules";
import type { Reading, ScoredVitalKey } from "./types";

const healthy: Pick<Reading, ScoredVitalKey> = {
  heartRate: 72,
  spo2: 97,
  systolicBp: 120,
  temperature: 36.8,
  glucose: 135,
};

describe("scoreVital: limits from the notebook's points rule", () => {
  const cases: [ScoredVitalKey, number, number][] = [
    ["heartRate", 50, 0],
    ["heartRate", 49, 2],
    ["heartRate", 100, 0],
    ["heartRate", 101, 1],
    ["heartRate", 120, 1],
    ["heartRate", 121, 2],

    ["spo2", 94, 0],
    ["spo2", 93.9, 1],
    ["spo2", 91, 1],
    ["spo2", 90.9, 3],

    ["systolicBp", 100, 0],
    ["systolicBp", 99, 1],
    ["systolicBp", 90, 1],
    ["systolicBp", 89, 3],
    ["systolicBp", 170, 0],
    ["systolicBp", 171, 1],
    ["systolicBp", 200, 1],
    ["systolicBp", 201, 3],

    ["temperature", 35.5, 0],
    ["temperature", 35.4, 2],
    ["temperature", 38, 0],
    ["temperature", 38.1, 1],
    ["temperature", 39, 1],
    ["temperature", 39.1, 2],

    ["glucose", 70, 0],
    ["glucose", 69, 3],
    ["glucose", 220, 0],
    ["glucose", 221, 1],
    ["glucose", 300, 1],
    ["glucose", 301, 3],
  ];

  it.each(cases)("%s = %d scores %d", (key, value, points) => {
    expect(scoreVital(key, value).points).toBe(points);
  });

  it("reports which side of the range the value fell on", () => {
    expect(scoreVital("heartRate", 45).direction).toBe("low");
    expect(scoreVital("heartRate", 130).direction).toBe("high");
    expect(scoreVital("heartRate", 72).direction).toBeNull();
  });

  it("gives a missing value no points (sensor dropout must not alert)", () => {
    expect(scoreVital("spo2", null).points).toBe(0);
    expect(scoreVital("spo2", Number.NaN).points).toBe(0);
  });
});

describe("statusFromPoints", () => {
  it.each([
    [0, "normal"],
    [1, "warning"],
    [2, "warning"],
    [3, "critical"],
    [8, "critical"],
  ])("%d points is %s", (points, status) => {
    expect(statusFromPoints(points)).toBe(status);
  });
});

describe("classifyReading", () => {
  it("is Normal when every vital is in range", () => {
    const result = classifyReading(healthy);
    expect(result.status).toBe("normal");
    expect(result.points).toBe(0);
  });

  it("is Warning for one mildly raised vital", () => {
    expect(classifyReading({ ...healthy, heartRate: 110 }).status).toBe(
      "warning",
    );
  });

  it("is Warning, not Critical, for a 2-point vital on its own", () => {
    const result = classifyReading({ ...healthy, heartRate: 130 });
    expect(result.points).toBe(2);
    expect(result.status).toBe("warning");
  });

  it("is Critical for a single 3-point vital", () => {
    expect(classifyReading({ ...healthy, spo2: 89 }).status).toBe("critical");
  });

  it("adds points across vitals: 2 + 1 is Critical", () => {
    const result = classifyReading({
      ...healthy,
      heartRate: 130,
      temperature: 38.4,
    });
    expect(result.points).toBe(3);
    expect(result.status).toBe("critical");
  });

  it("ignores glucose for a patient who is not monitored for it", () => {
    expect(classifyReading({ ...healthy, glucose: null }).status).toBe(
      "normal",
    );
  });

  it("does not alert when every sensor drops out", () => {
    const result = classifyReading({
      heartRate: null,
      spo2: null,
      systolicBp: null,
      temperature: null,
      glucose: null,
    });
    expect(result.status).toBe("normal");
  });

  it("names the vitals that scored, for the alert message", () => {
    const result = classifyReading({ ...healthy, spo2: 89, systolicBp: 175 });
    const failing = result.vitals.filter((vital) => vital.points > 0);
    expect(failing.map((vital) => vital.key)).toEqual(["spo2", "systolicBp"]);
  });

  it("uses per-patient thresholds when they are given", () => {
    const reading = { ...healthy, spo2: 92 };
    expect(classifyReading(reading).status).toBe("warning");

    const relaxed = {
      ...DEFAULT_THRESHOLDS,
      spo2: { severeLow: 86, mildLow: 90 },
    };
    expect(classifyReading(reading, relaxed).status).toBe("normal");
  });
});
