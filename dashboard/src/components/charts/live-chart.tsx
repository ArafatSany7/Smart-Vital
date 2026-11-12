"use client";

import { Liveline, type LivelinePoint } from "liveline";
import { useTheme } from "next-themes";
import { useState } from "react";
import { CANVAS_COLORS, type TrendVital } from "@/components/charts/chart-theme";
import { formatClock, formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import type { HistoryEntry } from "@/lib/vitals/feed";
import type { VitalLimits } from "@/lib/vitals/rules";

const WINDOWS = [
  { label: "1 min", secs: 60 },
  { label: "3 min", secs: 180 },
  { label: "10 min", secs: 600 },
];

function points(history: HistoryEntry[], pick: (entry: HistoryEntry) => number | null) {
  const out: LivelinePoint[] = [];
  for (const entry of history) {
    const value = pick(entry);
    if (value !== null) out.push({ time: entry.reading.timestamp / 1000, value });
  }
  return out;
}

function referenceFor(limits: VitalLimits, decimals: number) {
  if (limits.mildHigh !== undefined) {
    return { value: limits.mildHigh, label: `Warning above ${formatValue(limits.mildHigh, decimals)}` };
  }
  if (limits.mildLow !== undefined) {
    return { value: limits.mildLow, label: `Warning below ${formatValue(limits.mildLow, decimals)}` };
  }
  return undefined;
}

export default function LiveChart({
  vital,
  history,
  paused,
  limits,
}: {
  vital: TrendVital;
  history: HistoryEntry[];
  paused: boolean;
  limits: VitalLimits;
}) {
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";
  const colors = CANVAS_COLORS[theme];
  const [windowSecs, setWindowSecs] = useState(180);
  const display = VITAL_DISPLAY[vital];
  const format = (value: number) => `${formatValue(value, display.decimals)} ${display.unit}`;
  const formatTime = (seconds: number) => formatClock(seconds * 1000);

  const common = {
    theme,
    window: windowSecs,
    windows: WINDOWS,
    onWindowChange: setWindowSecs,
    windowStyle: "rounded" as const,
    grid: true,
    momentum: false,
    degen: false,
    paused,
    formatValue: format,
    formatTime,
    lineWidth: 2,
    emptyText: "No readings yet",
  };

  if (vital === "systolicBp") {
    const systolic = points(history, (entry) => entry.reading.systolicBp);
    const diastolic = points(history, (entry) => entry.reading.diastolicBp);
    return (
      <Liveline
        {...common}
        data={systolic}
        value={systolic.at(-1)?.value ?? 0}
        series={[
          { id: "sys", label: "Systolic", data: systolic, value: systolic.at(-1)?.value ?? 0, color: colors.primary },
          { id: "dia", label: "Diastolic", data: diastolic, value: diastolic.at(-1)?.value ?? 0, color: colors.secondary },
        ]}
      />
    );
  }

  const data = points(history, (entry) => entry.reading[vital]);
  return (
    <Liveline
      {...common}
      data={data}
      value={data.at(-1)?.value ?? 0}
      color={colors.primary}
      fill
      badge
      badgeVariant="minimal"
      referenceLine={referenceFor(limits, display.decimals)}
    />
  );
}
