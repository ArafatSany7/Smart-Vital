"use client";

import { Check, OctagonAlert, TriangleAlert } from "lucide-react";
import { Tile, TileHeader } from "@/components/ui/tile";
import { FeedHealthChip } from "@/components/vitals/feed-health";
import { statusSurface } from "@/components/vitals/vital-tile";
import { usePatientFeed } from "@/hooks/use-patient-feed";
import { cn } from "@/lib/cn";
import { formatAgo, formatClock, formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import { CRITICAL_POINTS } from "@/lib/vitals/rules";
import type { Status } from "@/lib/vitals/types";

const HEADLINE: Record<Status, { label: string; Icon: typeof Check; tone: string }> = {
  normal: { label: "Normal", Icon: Check, tone: "text-ink" },
  warning: { label: "Warning", Icon: TriangleAlert, tone: "text-warning" },
  critical: { label: "Critical", Icon: OctagonAlert, tone: "text-critical" },
};

export function ReadingStatusTile({
  patientId,
  index,
  className,
}: {
  patientId: string;
  index: number;
  className?: string;
}) {
  const { feed, health, now, paused } = usePatientFeed(patientId);
  const latest = feed?.latest ?? null;
  const classification = feed?.classification ?? null;
  const stale = health === "delayed" || health === "offline";
  const status = classification?.status ?? "normal";
  const { label, Icon, tone } = HEADLINE[status];
  const drivers = classification?.vitals.filter((vital) => vital.points > 0) ?? [];

  return (
    <Tile
      index={index}
      aria-label="Latest reading status"
      className={cn(
        "flex flex-col transition-[background-color,border-color] duration-300 ease-out",
        latest && !stale && statusSurface[status],
        className,
      )}
    >
      <TileHeader title="Latest reading" hint={latest ? formatClock(latest.timestamp) : undefined} />

      {latest && classification ? (
        <>
          <p className={cn("mt-4 flex items-center gap-2.5 text-3xl font-semibold tracking-tight", tone, stale && "opacity-50")}>
            <Icon className="size-7" aria-hidden="true" />
            {label}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {classification.points} point{classification.points === 1 ? "" : "s"} · Critical at{" "}
            {CRITICAL_POINTS} or more
          </p>

          {drivers.length > 0 ? (
            <ul className="mt-4 space-y-1.5 text-sm">
              {drivers.map((vital) => {
                const display = VITAL_DISPLAY[vital.key];
                return (
                  <li key={vital.key} className="flex items-center justify-between gap-3">
                    <span className="text-ink">
                      {display.label}{" "}
                      <span className="numeric text-ink-muted">
                        {vital.value === null ? "" : formatValue(vital.value, display.decimals)} {display.unit}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-ink-muted">
                      {vital.direction === "low" ? "Low" : "High"} · +{vital.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Every scored vital is within range.</p>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-subtle">Waiting for the first reading…</p>
      )}

      <div className="mt-auto space-y-3 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FeedHealthChip health={health} paused={paused} />
          {feed?.lastReceivedAt ? (
            <span className="text-xs text-ink-muted">
              {paused ? "Feed paused" : `Updated ${formatAgo(now - feed.lastReceivedAt)}`}
            </span>
          ) : null}
        </div>
        {stale && !paused ? (
          <p className="text-xs text-warning">
            No new reading from this patient&apos;s sensors. Values shown may be out of date.
          </p>
        ) : null}
        {feed ? (
          <p className="text-xs text-ink-subtle">
            Handled safely: {feed.duplicates} duplicate{feed.duplicates === 1 ? "" : "s"} ignored,{" "}
            {feed.late} late filed in history, {feed.rejected} impossible value{feed.rejected === 1 ? "" : "s"} rejected.
          </p>
        ) : null}
      </div>
    </Tile>
  );
}
