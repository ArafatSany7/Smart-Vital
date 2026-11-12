"use client";

import { Pause, Play } from "lucide-react";
import { button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import { FEED_INTERVAL_MS, useFeed } from "@/stores/feed";

export function FeedIndicator() {
  const running = useFeed((state) => state.running);
  const connected = useFeed((state) => Object.keys(state.patients).length > 0);
  const setRunning = useFeed((state) => state.setRunning);

  return (
    <div className="flex items-center gap-1">
      <p
        className={cn(
          "hidden h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs text-ink-muted sm:flex",
        )}
        aria-live="polite"
      >
        <StatusDot status="normal" className={running && connected ? "text-accent" : "text-ink-subtle"} />
        {!connected
          ? "Connecting…"
          : running
            ? `Live · a reading every ${FEED_INTERVAL_MS / 1000} s`
            : "Feed paused"}
      </p>
      <button
        type="button"
        disabled={!connected}
        onClick={() => setRunning(!running, Date.now())}
        aria-label={running ? "Pause the live feed" : "Resume the live feed"}
        title={running ? "Pause the live feed" : "Resume the live feed"}
        className={button({ intent: "ghost", size: "icon" })}
      >
        {running ? (
          <Pause className="size-[18px]" aria-hidden="true" />
        ) : (
          <Play className="size-[18px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
