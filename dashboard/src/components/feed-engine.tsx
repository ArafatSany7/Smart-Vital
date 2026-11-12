"use client";

import { useEffect } from "react";
import { useCaseload } from "@/hooks/use-caseload";
import { FEED_INTERVAL_MS, useFeed } from "@/stores/feed";

export function FeedEngine() {
  const { patients } = useCaseload();
  const key = patients.map((patient) => patient.id).join(",");

  useEffect(() => {
    if (!key) return;
    const { connect, tick, disconnect } = useFeed.getState();
    connect(key.split(","), Date.now());
    const timer = window.setInterval(() => tick(Date.now()), FEED_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      disconnect();
    };
  }, [key]);

  return null;
}
