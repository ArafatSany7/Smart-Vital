"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { TREND_VITALS, type TrendVital } from "@/components/charts/chart-theme";
import { HistoryChart } from "@/components/charts/history-chart";
import { Segmented } from "@/components/charts/segmented";
import { Tile } from "@/components/ui/tile";
import { usePatientFeed } from "@/hooks/use-patient-feed";
import { cn } from "@/lib/cn";
import { formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import { DEFAULT_THRESHOLDS } from "@/lib/vitals/rules";

const LiveChart = dynamic(() => import("@/components/charts/live-chart"), {
  ssr: false,
  loading: () => <div className="h-full" />,
});

type Mode = "live" | "history";

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={swatch} />
      {label}
    </li>
  );
}

export function TrendsTile({
  patientId,
  diabetic,
  index,
  className,
}: {
  patientId: string;
  diabetic: boolean;
  index: number;
  className?: string;
}) {
  const [mode, setMode] = useState<Mode>("history");
  const [vital, setVital] = useState<TrendVital>("heartRate");
  const { feed, paused } = usePatientFeed(patientId);
  const history = feed?.history ?? [];
  const display = VITAL_DISPLAY[vital];
  const limits = DEFAULT_THRESHOLDS[vital];
  const severe = [
    limits.severeLow !== undefined ? `below ${formatValue(limits.severeLow, display.decimals)}` : null,
    limits.severeHigh !== undefined ? `above ${formatValue(limits.severeHigh, display.decimals)}` : null,
  ].filter(Boolean).join(" or ");

  const vitals = TREND_VITALS.filter((key) => key !== "glucose" || diabetic).map((key) => ({
    value: key,
    label: VITAL_DISPLAY[key].shortLabel,
  }));

  const first = history[0]?.reading.timestamp;
  const last = history.at(-1)?.reading.timestamp;
  const minutes = first && last ? Math.max(1, Math.round((last - first) / 60000)) : 0;
  const latestValue = feed?.lastValues[vital]?.value;
  const summary = `${display.label} trend over the last ${minutes} minutes${
    latestValue !== undefined ? `, latest ${formatValue(latestValue, display.decimals)} ${display.unit}` : ""
  }.`;

  return (
    <Tile index={index} className={cn("flex flex-col", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Trends · {display.label}</h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {mode === "live" ? "Streaming as readings arrive" : `Last ${minutes} min · ${history.length} readings`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Vital to chart"
            options={vitals}
            value={vital}
            onChange={setVital}
          />
          <Segmented
            label="Chart view"
            options={[
              { value: "history", label: "History" },
              { value: "live", label: "Live" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
      </header>

      <div role="figure" aria-label={summary} className="relative mt-4 h-72">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${vital}`}
            className={cn(
              "absolute inset-0",
              mode === "live" && "flex flex-col [&>*:last-child]:min-h-0 [&>*:last-child]:flex-1",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {mode === "live" ? (
              <LiveChart vital={vital} history={history} paused={paused} />
            ) : (
              <HistoryChart vital={vital} history={history} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted">
        {vital === "systolicBp" ? (
          <>
            <LegendItem swatch="h-0.5 w-4 rounded-full bg-accent" label="Systolic" />
            <LegendItem swatch="h-0.5 w-4 rounded-full bg-ink-subtle" label="Diastolic" />
          </>
        ) : null}
        {mode === "history" ? (
          <>
            <LegendItem swatch="h-3 w-4 rounded-sm bg-ink/10" label="Normal range" />
            <LegendItem swatch="h-0 w-4 border-t-2 border-dashed border-critical-solid" label={`Severe limit: ${severe} ${display.unit}`} />
            <LegendItem swatch="size-2 rounded-full bg-warning-solid" label="Warning reading" />
            <LegendItem swatch="size-2 rounded-full bg-critical-solid" label="Critical reading" />
            <li>Gaps mean no signal</li>
          </>
        ) : (
          <li>Dashed line marks where Warning starts. Hover the chart to read past values.</li>
        )}
      </ul>
    </Tile>
  );
}
