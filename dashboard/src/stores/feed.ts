import { create } from "zustand";
import { getSimulationProfile } from "@/lib/data/patients";
import { STABLE, stepDeterioration, type Deterioration } from "@/lib/vitals/deterioration";
import { applyFaults, createSensorState, type SensorState } from "@/lib/vitals/faults";
import { emptyFeed, ingest, reclassifyLatest, type PatientFeed } from "@/lib/vitals/feed";
import { Rng } from "@/lib/vitals/random";
import { generateReading, type SimulationProfile } from "@/lib/vitals/simulator";
import type { Reading } from "@/lib/vitals/types";
import { useAlerts } from "@/stores/alerts";
import { thresholdsFor } from "@/stores/thresholds";

export const FEED_INTERVAL_MS = 3000;
const BACKFILL_READINGS = 200;

interface Sensor {
  profile: SimulationProfile;
  rng: Rng;
  faultRng: Rng;
  courseRng: Rng;
  state: SensorState;
  course: Deterioration;
}

const sensors = new Map<string, Sensor>();

function seedFor(patientId: string): number {
  return Number(patientId.replace(/\D/g, "")) * 7919 + 17;
}

function nextReading(sensor: Sensor, at: number): Reading {
  const step = stepDeterioration(sensor.course, sensor.profile.riskLevel, sensor.courseRng);
  sensor.course = step.state;
  return generateReading(sensor.profile, sensor.rng, at, step.severity);
}

function receive(feed: PatientFeed, message: Reading, at: number, historical: boolean): PatientFeed {
  const result = ingest(feed, message, at, thresholdsFor(message.patientId));
  if (result.outcome === "accepted" && result.feed.classification) {
    useAlerts.getState().process(message, result.feed.classification, at, historical);
  }
  return result.feed;
}

interface FeedState {
  patients: Record<string, PatientFeed>;
  running: boolean;
  pausedAt: number | null;
  connect: (patientIds: string[], now: number) => void;
  tick: (now: number) => void;
  setRunning: (running: boolean, now: number) => void;
  reclassify: (patientId: string) => void;
  disconnect: () => void;
}

export const useFeed = create<FeedState>()((set, get) => ({
  patients: {},
  running: true,
  pausedAt: null,

  connect: (patientIds, now) => {
    sensors.clear();
    useAlerts.getState().clear();
    const patients: Record<string, PatientFeed> = {};

    for (const patientId of patientIds) {
      const profile = getSimulationProfile(patientId);
      if (!profile) continue;
      const sensor: Sensor = {
        profile,
        rng: new Rng(seedFor(patientId)),
        faultRng: new Rng(seedFor(patientId) + 1),
        courseRng: new Rng(seedFor(patientId) + 2),
        state: createSensorState(),
        course: STABLE,
      };
      sensors.set(patientId, sensor);

      let feed = emptyFeed();
      for (let step = BACKFILL_READINGS; step >= 1; step -= 1) {
        const at = now - step * FEED_INTERVAL_MS;
        feed = receive(feed, nextReading(sensor, at), at, true);
      }
      patients[patientId] = feed;
    }

    set({ patients, running: true, pausedAt: null });
    window.setTimeout(() => useAlerts.getState().carryOver(Date.now()), 0);
  },

  tick: (now) => {
    if (!get().running || sensors.size === 0) return;
    const patients = { ...get().patients };

    for (const [patientId, sensor] of sensors) {
      const reading = nextReading(sensor, now);
      const { sent, state } = applyFaults(reading, sensor.state, sensor.faultRng);
      sensor.state = state;
      let feed = patients[patientId] ?? emptyFeed();
      for (const message of sent) feed = receive(feed, message, now, false);
      patients[patientId] = feed;
    }

    set({ patients });
    useAlerts.getState().escalate(now);
  },

  setRunning: (running, now) => {
    set({ running, pausedAt: running ? null : now });
    if (running) get().tick(now);
  },

  reclassify: (patientId) => {
    const feed = get().patients[patientId];
    if (!feed) return;
    set({
      patients: { ...get().patients, [patientId]: reclassifyLatest(feed, thresholdsFor(patientId)) },
    });
  },

  disconnect: () => {
    sensors.clear();
    useAlerts.getState().clear();
    set({ patients: {}, running: true, pausedAt: null });
  },
}));
