import {
  classifyReading,
  DEFAULT_THRESHOLDS,
  type Classification,
  type Thresholds,
} from "./rules";
import type { Reading, ScoredVitalKey, Status, VitalKey } from "./types";
import { validateReading, VITAL_KEYS } from "./validate";

export const HISTORY_LIMIT = 600;

export interface LastValue {
  value: number;
  at: number;
}

export interface HistoryEntry {
  reading: Reading;
  status: Status;
  points: number;
  rejected: VitalKey[];
  late: boolean;
  scores: Partial<Record<ScoredVitalKey, Status>>;
}

export interface PatientFeed {
  history: HistoryEntry[];
  latest: Reading | null;
  classification: Classification | null;
  lastValues: Partial<Record<VitalKey, LastValue>>;
  lastReceivedAt: number | null;
  duplicates: number;
  late: number;
  rejected: number;
  lastRejected: VitalKey[];
  latestRejected: VitalKey[];
}

export type IngestOutcome = "accepted" | "late" | "duplicate";

export function emptyFeed(): PatientFeed {
  return {
    history: [],
    latest: null,
    classification: null,
    lastValues: {},
    lastReceivedAt: null,
    duplicates: 0,
    late: 0,
    rejected: 0,
    lastRejected: [],
    latestRejected: [],
  };
}

function insertSorted(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [...history];
  let index = next.length;
  while (index > 0 && next[index - 1].reading.timestamp > entry.reading.timestamp) index -= 1;
  next.splice(index, 0, entry);
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

export function ingest(
  feed: PatientFeed,
  incoming: Reading,
  receivedAt: number,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): { feed: PatientFeed; outcome: IngestOutcome } {
  if (feed.history.some((entry) => entry.reading.timestamp === incoming.timestamp)) {
    return {
      feed: { ...feed, duplicates: feed.duplicates + 1, lastReceivedAt: receivedAt },
      outcome: "duplicate",
    };
  }

  const { reading, rejected } = validateReading(incoming);
  const isLate = feed.latest !== null && reading.timestamp < feed.latest.timestamp;
  const classification = classifyReading(reading, thresholds);
  const scores: Partial<Record<ScoredVitalKey, Status>> = {};
  for (const vital of classification.vitals) {
    if (vital.value !== null) scores[vital.key] = vital.status;
  }
  const history = insertSorted(feed.history, {
    reading,
    status: classification.status,
    points: classification.points,
    rejected,
    late: isLate,
    scores,
  });

  const base: PatientFeed = {
    ...feed,
    history,
    lastReceivedAt: receivedAt,
    rejected: feed.rejected + (rejected.length > 0 ? 1 : 0),
    lastRejected: rejected.length > 0 ? rejected : feed.lastRejected,
  };

  if (isLate) {
    return { feed: { ...base, late: feed.late + 1 }, outcome: "late" };
  }

  const lastValues = { ...feed.lastValues };
  for (const key of VITAL_KEYS) {
    const value = reading[key];
    if (value !== null) lastValues[key] = { value, at: reading.timestamp };
  }

  return {
    feed: {
      ...base,
      latest: reading,
      latestRejected: rejected,
      lastValues,
      classification,
    },
    outcome: "accepted",
  };
}

export function reclassifyLatest(feed: PatientFeed, thresholds: Thresholds): PatientFeed {
  if (!feed.latest) return feed;
  return { ...feed, classification: classifyReading(feed.latest, thresholds) };
}

export type FeedHealth = "waiting" | "live" | "delayed" | "offline";

export function feedHealth(
  feed: PatientFeed | undefined,
  now: number,
  intervalMs: number,
): FeedHealth {
  if (!feed?.latest || feed.lastReceivedAt === null) return "waiting";
  const silence = now - feed.lastReceivedAt;
  if (silence > intervalMs * 10) return "offline";
  if (silence > intervalMs * 2.5) return "delayed";
  return "live";
}
