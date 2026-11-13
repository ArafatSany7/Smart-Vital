import { describe, expect, it } from "vitest";
import {
  alertState,
  carryOverOpen,
  dueForEscalation,
  ESCALATE_AFTER_MS,
  processReading,
  RESOLVE_AFTER_NORMAL_READINGS,
  type Alert,
  type EpisodeTracker,
} from "./alerts";
import { classifyReading } from "./rules";
import type { Reading } from "./types";

function reading(timestamp: number, overrides: Partial<Reading> = {}): Reading {
  return {
    patientId: "P007",
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

const critical = (t: number) => reading(t, { spo2: 88, heartRate: 128 });
const calm = (t: number) => reading(t);

function run(readings: Reading[]) {
  let alerts: Alert[] = [];
  let tracker: EpisodeTracker = { openAlertId: null, calmStreak: 0 };
  const events: string[] = [];
  for (const r of readings) {
    const result = processReading(alerts, tracker, r, classifyReading(r), r.timestamp);
    alerts = result.alerts;
    tracker = result.tracker;
    if (result.event) events.push(result.event.type);
  }
  return { alerts, tracker, events };
}

describe("processReading (R4 alerts)", () => {
  it("raises an alert with patient ID, timestamp and the failing vitals", () => {
    const { alerts, events } = run([critical(1000)]);
    expect(events).toEqual(["raised"]);
    expect(alerts).toHaveLength(1);
    const [alert] = alerts;
    expect(alert.patientId).toBe("P007");
    expect(alert.startedAt).toBe(1000);
    expect(alert.trigger.map((vital) => vital.key)).toEqual(["spo2", "heartRate"]);
    expect(alert.trigger[0]).toMatchObject({ value: 88, points: 3, direction: "low" });
    expect(alertState(alert)).toBe("open");
  });

  it("does not alert for Normal or Warning readings", () => {
    const { alerts } = run([calm(1), reading(2, { heartRate: 110 })]);
    expect(alerts).toEqual([]);
  });

  it("raises one alert per episode, not one per Critical reading", () => {
    const { alerts, events } = run([critical(1), critical(2), critical(3)]);
    expect(events).toEqual(["raised"]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].readingCount).toBe(3);
    expect(alerts[0].lastCriticalAt).toBe(3);
  });

  it("resolves only after enough calm readings in a row", () => {
    const calmRun = Array.from({ length: RESOLVE_AFTER_NORMAL_READINGS }, (_, i) => calm(10 + i));
    const almost = run([critical(1), ...calmRun.slice(0, -1)]);
    expect(alertState(almost.alerts[0])).toBe("open");

    const done = run([critical(1), ...calmRun]);
    expect(done.events).toEqual(["raised", "resolved"]);
    expect(alertState(done.alerts[0])).toBe("resolved");
  });

  it("does not resolve while the patient is still at Warning", () => {
    const warnings = Array.from({ length: 6 }, (_, i) => reading(10 + i, { heartRate: 110 }));
    const { alerts, events } = run([critical(1), ...warnings]);
    expect(events).toEqual(["raised"]);
    expect(alertState(alerts[0])).toBe("open");
  });

  it("starts the Normal count again after a Warning", () => {
    const { alerts } = run([critical(1), calm(2), calm(3), reading(4, { heartRate: 110 }), calm(5), calm(6)]);
    expect(alertState(alerts[0])).toBe("open");
  });

  it("restarts the calm count when the patient is Critical again", () => {
    const { alerts, events } = run([critical(1), calm(2), calm(3), critical(4), calm(5), calm(6)]);
    expect(events).toEqual(["raised"]);
    expect(alertState(alerts[0])).toBe("open");
  });

  it("does not treat a sensor dropout as recovery", () => {
    const dropouts = Array.from({ length: 5 }, (_, i) => reading(10 + i, { spo2: null }));
    const { alerts } = run([critical(1), ...dropouts]);
    expect(alertState(alerts[0])).toBe("open");
  });

  it("raises a new alert for a new episode after the last one resolved", () => {
    const calmRun = Array.from({ length: RESOLVE_AFTER_NORMAL_READINGS }, (_, i) => calm(10 + i));
    const { alerts, events } = run([critical(1), ...calmRun, critical(50)]);
    expect(events).toEqual(["raised", "resolved", "raised"]);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].startedAt).toBe(50);
  });
});

describe("dueForEscalation", () => {
  const base = run([critical(0)]).alerts[0];

  it("escalates an open alert nobody acknowledged in time", () => {
    expect(dueForEscalation([base], ESCALATE_AFTER_MS - 1)).toEqual([]);
    expect(dueForEscalation([base], ESCALATE_AFTER_MS)).toEqual([base]);
  });

  it("never escalates acknowledged, resolved, already escalated or historical alerts", () => {
    const later = ESCALATE_AFTER_MS * 2;
    expect(dueForEscalation([{ ...base, acknowledgedAt: 5, acknowledgedBy: "C01" }], later)).toEqual([]);
    expect(dueForEscalation([{ ...base, resolvedAt: 5 }], later)).toEqual([]);
    expect(dueForEscalation([{ ...base, escalatedAt: 5 }], later)).toEqual([]);
    expect(dueForEscalation([{ ...base, historical: true }], later)).toEqual([]);
  });
});

describe("carryOverOpen", () => {
  it("brings alerts still open at sign-in forward so they notify and can escalate", () => {
    const [open] = run([critical(0)]).alerts;
    const historicalOpen = { ...open, historical: true };
    const resolved = { ...open, id: "old", historical: true, resolvedAt: 5 };
    const { alerts, carried } = carryOverOpen([historicalOpen, resolved], 9000);
    expect(carried.map((alert) => alert.id)).toEqual([open.id]);
    expect(alerts[0]).toMatchObject({ historical: false, carriedOver: true, raisedAt: 9000 });
    expect(alerts[1]).toEqual(resolved);
    expect(dueForEscalation(alerts, 9000 + ESCALATE_AFTER_MS)).toHaveLength(1);
  });
});
