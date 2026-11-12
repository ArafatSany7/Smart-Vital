"use client";

import { useSyncExternalStore } from "react";
import { useFeed } from "@/stores/feed";

let current = 0;
const listeners = new Set<() => void>();
let timer: number | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    current = Date.now();
    timer = window.setInterval(() => {
      current = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (current === 0) current = Date.now();
      return current;
    },
    () => 0,
  );
}

export function useFeedClock(): number {
  const now = useNow();
  const pausedAt = useFeed((state) => state.pausedAt);
  return pausedAt ?? now;
}
