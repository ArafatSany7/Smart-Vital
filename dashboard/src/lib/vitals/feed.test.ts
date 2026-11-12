import { describe, expect, it } from "vitest";
import { emptyFeed, feedHealth, HISTORY_LIMIT, ingest, type PatientFeed } from "./feed";
import { applyFaults, createSensorState } from "./faults";
import { Rng } from "./random";
import type { Reading } from "./types";
import { validateReading } from "./validate";

const INTERVAL = 3000;

function reading(timestamp: number, overrides: Partial<Reading> = {}): Reading {
  return {
    patientId: "P001",
    timestamp,
    heartRate: 72,
    spo2: 97,
    systolicBp: 120,
    diastolicBp: 78,
    temperature: 36.8,
    glucose: null,
    ...overrides,
  };
}

function feedOf(...readings: Reading[]): PatientFeed {
  return readings.reduce((feed, r) => ingest(feed, r, r.timestamp).feed, emptyFeed());
}

describe("validateReading (impossible values, R9)", () => {
  it("keeps a plausible reading unchanged", () => {
    const result = validateReading(reading(1));
    expect(result.rejected).toEqual([]);
    expect(result.reading).toEqual(reading(1));
  });

  it("removes physically impossible values instead of scoring them", () => {
    const result = validateReading(reading(1, { heartRate: 312, spo2: 0 }));
    expect(result.rejected).toEqual(["heartRate", "spo2"]);
    expect(result.reading.heartRate).toBeNull();
    expect(result.reading.spo2).toBeNull();
    expect(result.reading.temperature).toBe(36.8);
  });

  it("drops diastolic too when the systolic value was an artefact", () => {
    const result = validateReading(reading(1, { systolicBp: 0 }));
    expect(result.reading.systolicBp).toBeNull();
    expect(result.reading.diastolicBp).toBeNull();
  });

  it("leaves genuinely low but possible values to the rule", () => {
    const result = validateReading(reading(1, { spo2: 84, heartRate: 38 }));
    expect(result.rejected).toEqual([]);
  });
});

describe("ingest", () => {
  it("accepts readings and classifies the latest", () => {
    const feed = feedOf(reading(1000), reading(2000, { spo2: 89 }));
    expect(feed.history).toHaveLength(2);
    expect(feed.latest?.timestamp).toBe(2000);
    expect(feed.classification?.status).toBe("critical");
  });

  it("ignores a duplicate message with the same timestamp", () => {
    const first = feedOf(reading(1000));
    const { feed, outcome } = ingest(first, reading(1000, { spo2: 80 }), 1100);
    expect(outcome).toBe("duplicate");
    expect(feed.history).toHaveLength(1);
    expect(feed.duplicates).toBe(1);
    expect(feed.classification?.status).toBe("normal");
  });

  it("files a late reading in history without replacing the latest", () => {
    const current = feedOf(reading(1000), reading(3000));
    const { feed, outcome } = ingest(current, reading(2000, { spo2: 85 }), 3500);
    expect(outcome).toBe("late");
    expect(feed.history.map((r) => r.timestamp)).toEqual([1000, 2000, 3000]);
    expect(feed.latest?.timestamp).toBe(3000);
    expect(feed.classification?.status).toBe("normal");
  });

  it("does not raise Critical for an artefact", () => {
    const feed = feedOf(reading(1000, { spo2: 0, heartRate: 312 }));
    expect(feed.classification?.status).toBe("normal");
    expect(feed.rejected).toBe(1);
    expect(feed.lastRejected).toEqual(["heartRate", "spo2"]);
    expect(feed.latestRejected).toEqual(["heartRate", "spo2"]);
  });

  it("remembers the last real value of a vital that dropped out", () => {
    const feed = feedOf(reading(1000, { heartRate: 81 }), reading(2000, { heartRate: null }));
    expect(feed.latest?.heartRate).toBeNull();
    expect(feed.lastValues.heartRate).toEqual({ value: 81, at: 1000 });
  });

  it("keeps history bounded", () => {
    const readings = Array.from({ length: HISTORY_LIMIT + 25 }, (_, i) => reading(i * 1000));
    expect(feedOf(...readings).history).toHaveLength(HISTORY_LIMIT);
  });
});

describe("feedHealth", () => {
  it("is waiting before any reading", () => {
    expect(feedHealth(undefined, 0, INTERVAL)).toBe("waiting");
    expect(feedHealth(emptyFeed(), 0, INTERVAL)).toBe("waiting");
  });

  it("moves from live to delayed to offline as silence grows", () => {
    const feed = feedOf(reading(0));
    expect(feedHealth(feed, INTERVAL, INTERVAL)).toBe("live");
    expect(feedHealth(feed, INTERVAL * 3, INTERVAL)).toBe("delayed");
    expect(feedHealth(feed, INTERVAL * 11, INTERVAL)).toBe("offline");
  });
});

describe("applyFaults", () => {
  it("over many ticks delivers most readings and produces every fault type", () => {
    const rng = new Rng(9);
    let state = createSensorState();
    let feed = emptyFeed();
    let delivered = 0;
    const outcomes = new Set<string>();

    for (let tick = 0; tick < 4000; tick += 1) {
      const result = applyFaults(reading(tick * INTERVAL), state, rng);
      state = result.state;
      for (const message of result.sent) {
        delivered += 1;
        const step = ingest(feed, message, tick * INTERVAL);
        feed = step.feed;
        outcomes.add(step.outcome);
      }
    }

    expect(delivered).toBeGreaterThan(3500);
    expect(outcomes).toEqual(new Set(["accepted", "late", "duplicate"]));
    expect(feed.rejected).toBeGreaterThan(0);
  });

  it("sends nothing while a sensor is stalled", () => {
    const stalled = { stalledTicks: 3, heldBack: null };
    const result = applyFaults(reading(0), stalled, new Rng(1));
    expect(result.sent).toEqual([]);
    expect(result.state.stalledTicks).toBe(2);
  });
});
