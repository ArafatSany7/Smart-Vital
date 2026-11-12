import { create } from "zustand";
import { getSimulationProfile } from "@/lib/data/patients";
import { applyFaults, createSensorState, type SensorState } from "@/lib/vitals/faults";
import { emptyFeed, ingest, type PatientFeed } from "@/lib/vitals/feed";
import { Rng } from "@/lib/vitals/random";
import { generateReading, type SimulationProfile } from "@/lib/vitals/simulator";

export const FEED_INTERVAL_MS = 3000;
const BACKFILL_READINGS = 200;

interface Sensor {
  profile: SimulationProfile;
  rng: Rng;
  faultRng: Rng;
  state: SensorState;
}

const sensors = new Map<string, Sensor>();

function seedFor(patientId: string): number {
  return Number(patientId.replace(/\D/g, "")) * 7919 + 17;
}

interface FeedState {
  patients: Record<string, PatientFeed>;
  running: boolean;
  pausedAt: number | null;
  connect: (patientIds: string[], now: number) => void;
  tick: (now: number) => void;
  setRunning: (running: boolean, now: number) => void;
  disconnect: () => void;
}

export const useFeed = create<FeedState>()((set, get) => ({
  patients: {},
  running: true,
  pausedAt: null,

  connect: (patientIds, now) => {
    sensors.clear();
    const patients: Record<string, PatientFeed> = {};

    for (const patientId of patientIds) {
      const profile = getSimulationProfile(patientId);
      if (!profile) continue;
      const rng = new Rng(seedFor(patientId));
      sensors.set(patientId, {
        profile,
        rng,
        faultRng: new Rng(seedFor(patientId) + 1),
        state: createSensorState(),
      });

      let feed = emptyFeed();
      for (let step = BACKFILL_READINGS; step >= 1; step -= 1) {
        const at = now - step * FEED_INTERVAL_MS;
        feed = ingest(feed, generateReading(profile, rng, at), at).feed;
      }
      patients[patientId] = feed;
    }

    set({ patients, running: true, pausedAt: null });
  },

  tick: (now) => {
    if (!get().running || sensors.size === 0) return;
    const patients = { ...get().patients };

    for (const [patientId, sensor] of sensors) {
      const reading = generateReading(sensor.profile, sensor.rng, now);
      const { sent, state } = applyFaults(reading, sensor.state, sensor.faultRng);
      sensor.state = state;
      let feed = patients[patientId] ?? emptyFeed();
      for (const message of sent) feed = ingest(feed, message, now).feed;
      patients[patientId] = feed;
    }

    set({ patients });
  },

  setRunning: (running, now) => {
    set({ running, pausedAt: running ? null : now });
    if (running) get().tick(now);
  },

  disconnect: () => {
    sensors.clear();
    set({ patients: {}, running: true, pausedAt: null });
  },
}));
