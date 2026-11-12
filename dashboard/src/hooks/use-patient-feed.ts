"use client";

import { useFeedClock } from "@/hooks/use-now";
import { feedHealth, type FeedHealth, type PatientFeed } from "@/lib/vitals/feed";
import type { Status } from "@/lib/vitals/types";
import { FEED_INTERVAL_MS, useFeed } from "@/stores/feed";

export function usePatientFeed(patientId: string): {
  feed: PatientFeed | undefined;
  health: FeedHealth;
  now: number;
  paused: boolean;
} {
  const feed = useFeed((state) => state.patients[patientId]);
  const paused = useFeed((state) => !state.running);
  const now = useFeedClock();
  return { feed, health: feedHealth(feed, now, FEED_INTERVAL_MS), now, paused };
}

export function usePatientStatus(patientId: string): Status | null {
  return useFeed((state) => state.patients[patientId]?.classification?.status ?? null);
}
