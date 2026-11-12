import { create } from "zustand";
import {
  carryOverOpen,
  dueForEscalation,
  processReading,
  type Alert,
  type AlertEvent,
  type EpisodeTracker,
} from "@/lib/vitals/alerts";
import type { Classification } from "@/lib/vitals/rules";
import type { Reading } from "@/lib/vitals/types";

type Listener = (event: AlertEvent) => void;
const listeners = new Set<Listener>();

export function onAlertEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: AlertEvent) {
  listeners.forEach((listener) => listener(event));
}

interface AlertStore {
  alerts: Alert[];
  trackers: Record<string, EpisodeTracker>;
  process: (reading: Reading, classification: Classification, receivedAt: number, historical: boolean) => void;
  escalate: (now: number) => void;
  carryOver: (now: number) => void;
  acknowledge: (alertId: string, by: string, at: number) => void;
  acknowledgeAllFor: (patientId: string, by: string, at: number) => void;
  clear: () => void;
}

export const useAlerts = create<AlertStore>()((set, get) => ({
  alerts: [],
  trackers: {},

  process: (reading, classification, receivedAt, historical) => {
    const { alerts, trackers } = get();
    const tracker = trackers[reading.patientId] ?? { openAlertId: null, calmStreak: 0 };
    const result = processReading(alerts, tracker, reading, classification, receivedAt, historical);
    if (result.alerts === alerts && result.tracker === tracker) return;
    set({
      alerts: result.alerts,
      trackers: { ...trackers, [reading.patientId]: result.tracker },
    });
    if (result.event && !historical) emit(result.event);
  },

  escalate: (now) => {
    const due = dueForEscalation(get().alerts, now);
    if (due.length === 0) return;
    const ids = new Set(due.map((alert) => alert.id));
    const alerts = get().alerts.map((alert) =>
      ids.has(alert.id) ? { ...alert, escalatedAt: now } : alert,
    );
    set({ alerts });
    for (const alert of alerts) {
      if (ids.has(alert.id)) emit({ type: "escalated", alert });
    }
  },

  carryOver: (now) => {
    const { alerts, carried } = carryOverOpen(get().alerts, now);
    if (carried.length === 0) return;
    set({ alerts });
    for (const alert of carried) emit({ type: "raised", alert });
  },

  acknowledge: (alertId, by, at) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId && alert.acknowledgedAt === null
          ? { ...alert, acknowledgedAt: at, acknowledgedBy: by }
          : alert,
      ),
    })),

  acknowledgeAllFor: (patientId, by, at) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.patientId === patientId && alert.acknowledgedAt === null && alert.resolvedAt === null
          ? { ...alert, acknowledgedAt: at, acknowledgedBy: by }
          : alert,
      ),
    })),

  clear: () => set({ alerts: [], trackers: {} }),
}));
