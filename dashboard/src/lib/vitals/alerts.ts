import type { Classification } from "./rules";
import type { Reading, ScoredVitalKey } from "./types";

export const RESOLVE_AFTER_CALM_READINGS = 3;
export const ESCALATE_AFTER_MS = 45_000;

export interface AlertVital {
  key: ScoredVitalKey;
  value: number;
  points: number;
  direction: "low" | "high";
}

export interface Alert {
  id: string;
  patientId: string;
  startedAt: number;
  raisedAt: number;
  lastCriticalAt: number;
  readingCount: number;
  points: number;
  trigger: AlertVital[];
  latest: AlertVital[];
  acknowledgedAt: number | null;
  acknowledgedBy: string | null;
  escalatedAt: number | null;
  resolvedAt: number | null;
  historical: boolean;
  carriedOver: boolean;
}

export type AlertState = "open" | "acknowledged" | "resolved";

export interface EpisodeTracker {
  openAlertId: string | null;
  calmStreak: number;
}

export type AlertEvent =
  | { type: "raised"; alert: Alert }
  | { type: "escalated"; alert: Alert }
  | { type: "resolved"; alert: Alert };

export function alertState(alert: Alert): AlertState {
  if (alert.resolvedAt !== null) return "resolved";
  if (alert.acknowledgedAt !== null) return "acknowledged";
  return "open";
}

export function failingVitals(classification: Classification): AlertVital[] {
  return classification.vitals
    .filter((vital) => vital.points > 0 && vital.value !== null && vital.direction !== null)
    .map((vital) => ({
      key: vital.key,
      value: vital.value as number,
      points: vital.points,
      direction: vital.direction as "low" | "high",
    }))
    .sort((a, b) => b.points - a.points);
}

export function processReading(
  alerts: Alert[],
  tracker: EpisodeTracker,
  reading: Reading,
  classification: Classification,
  receivedAt: number,
  historical = false,
): { alerts: Alert[]; tracker: EpisodeTracker; event: AlertEvent | null } {
  const openIndex = tracker.openAlertId
    ? alerts.findIndex((alert) => alert.id === tracker.openAlertId)
    : -1;
  const open = openIndex >= 0 ? alerts[openIndex] : null;

  if (classification.status === "critical") {
    const vitals = failingVitals(classification);
    if (open) {
      const updated: Alert = {
        ...open,
        lastCriticalAt: reading.timestamp,
        readingCount: open.readingCount + 1,
        points: Math.max(open.points, classification.points),
        latest: vitals,
      };
      const next = [...alerts];
      next[openIndex] = updated;
      return { alerts: next, tracker: { openAlertId: open.id, calmStreak: 0 }, event: null };
    }

    const alert: Alert = {
      id: `${reading.patientId}-${reading.timestamp}`,
      patientId: reading.patientId,
      startedAt: reading.timestamp,
      raisedAt: receivedAt,
      lastCriticalAt: reading.timestamp,
      readingCount: 1,
      points: classification.points,
      trigger: vitals,
      latest: vitals,
      acknowledgedAt: null,
      acknowledgedBy: null,
      escalatedAt: null,
      resolvedAt: null,
      historical,
      carriedOver: false,
    };
    return {
      alerts: [alert, ...alerts],
      tracker: { openAlertId: alert.id, calmStreak: 0 },
      event: { type: "raised", alert },
    };
  }

  if (!open) return { alerts, tracker, event: null };

  const triggerPresent = open.trigger.every((vital) => reading[vital.key] !== null);
  if (!triggerPresent) return { alerts, tracker, event: null };

  const calmStreak = tracker.calmStreak + 1;
  if (calmStreak < RESOLVE_AFTER_CALM_READINGS) {
    return { alerts, tracker: { ...tracker, calmStreak }, event: null };
  }

  const resolved: Alert = { ...open, resolvedAt: reading.timestamp };
  const next = [...alerts];
  next[openIndex] = resolved;
  return {
    alerts: next,
    tracker: { openAlertId: null, calmStreak: 0 },
    event: { type: "resolved", alert: resolved },
  };
}

export function carryOverOpen(alerts: Alert[], now: number): { alerts: Alert[]; carried: Alert[] } {
  const carried: Alert[] = [];
  const next = alerts.map((alert) => {
    if (!alert.historical || alertState(alert) !== "open") return alert;
    const updated = { ...alert, historical: false, carriedOver: true, raisedAt: now };
    carried.push(updated);
    return updated;
  });
  return { alerts: next, carried };
}

export function dueForEscalation(alerts: Alert[], now: number): Alert[] {
  return alerts.filter(
    (alert) =>
      alertState(alert) === "open" &&
      !alert.historical &&
      alert.escalatedAt === null &&
      now - alert.raisedAt >= ESCALATE_AFTER_MS,
  );
}
