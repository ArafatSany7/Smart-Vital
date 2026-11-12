"use client";

import NumberFlow from "@number-flow/react";
import { Ban, Droplet, Gauge, HeartPulse, Thermometer, Unplug, Wind } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Sparkline } from "@/components/vitals/sparkline";
import { StatusBadge, StatusDot } from "@/components/ui/status";
import { Tile } from "@/components/ui/tile";
import { usePatientFeed } from "@/hooks/use-patient-feed";
import { cn } from "@/lib/cn";
import { formatAgo, formatValue, normalRange, VITAL_DISPLAY } from "@/lib/vitals/display";
import { DEFAULT_THRESHOLDS } from "@/lib/vitals/rules";
import type { ScoredVitalKey, Status } from "@/lib/vitals/types";

const ICONS: Record<ScoredVitalKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  heartRate: HeartPulse,
  spo2: Wind,
  systolicBp: Gauge,
  temperature: Thermometer,
  glucose: Droplet,
};

export const statusSurface: Record<Status, string> = {
  normal: "",
  warning: "border-warning-line bg-warning-soft",
  critical: "critical-ring border-critical-line bg-critical-soft",
};

const SPARK_POINTS = 30;

const FLOW_TIMING = { duration: 450, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

function numberFormat(decimals: number) {
  return { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
}

export function VitalTile({
  patientId,
  vital,
  monitored = true,
  index,
  className,
}: {
  patientId: string;
  vital: ScoredVitalKey;
  monitored?: boolean;
  index: number;
  className?: string;
}) {
  const display = VITAL_DISPLAY[vital];
  const Icon = ICONS[vital];
  const { feed, health, now } = usePatientFeed(patientId);
  const limits = DEFAULT_THRESHOLDS[vital];
  const isBp = vital === "systolicBp";

  const header = (status: Status | null) => (
    <header className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="size-4 text-ink-muted" aria-hidden="true" />
        {display.label}
      </h3>
      {status ? <StatusBadge status={status} /> : null}
    </header>
  );

  if (!monitored) {
    return (
      <Tile index={index} className={cn("flex flex-col border-dashed bg-transparent shadow-none", className)}>
        {header(null)}
        <p className="mt-6 text-2xl font-medium text-ink-subtle">Not monitored</p>
        <p className="mt-2 text-sm text-ink-muted">
          Glucose is tracked only for patients with diabetes.
        </p>
      </Tile>
    );
  }

  const latest = feed?.latest ?? null;
  const value = latest?.[vital] ?? null;
  const diastolic = latest?.diastolicBp ?? null;
  const score = feed?.classification?.vitals.find((entry) => entry.key === vital);
  const status: Status = value === null ? "normal" : score?.status ?? "normal";
  const stale = health === "delayed" || health === "offline";
  const rejected = feed?.latestRejected.includes(vital) ?? false;
  const lastKnown = feed?.lastValues[vital];
  const history = (feed?.history ?? []).slice(-SPARK_POINTS).map((reading) => reading[vital]);

  return (
    <Tile
      index={index}
      className={cn(
        "flex flex-col transition-[background-color,border-color] duration-300 ease-out",
        !stale && value !== null && statusSurface[status],
        className,
      )}
    >
      {header(latest === null ? null : value === null ? null : status)}

      <div className={cn("mt-4 min-h-14 transition-opacity duration-300", stale && "opacity-50")}>
        {latest === null ? (
          <p className="text-sm text-ink-subtle">Waiting for the first reading…</p>
        ) : value === null ? (
          <div>
            <p className="flex items-center gap-2 text-2xl font-medium text-ink-muted">
              {rejected ? (
                <Ban className="size-5" aria-hidden="true" />
              ) : (
                <Unplug className="size-5" aria-hidden="true" />
              )}
              {rejected ? "Value rejected" : "No signal"}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {rejected ? "The sensor sent an impossible value, so it was ignored. " : ""}
              {lastKnown
                ? `Last ${formatValue(lastKnown.value, display.decimals)}${isBp ? "" : ` ${display.unit}`}, ${formatAgo(now - lastKnown.at)}.`
                : "No earlier value."}
            </p>
          </div>
        ) : (
          <p className="flex items-baseline gap-1.5 text-ink">
            <NumberFlow
              value={value}
              format={numberFormat(display.decimals)}
              transformTiming={FLOW_TIMING}
              spinTiming={FLOW_TIMING}
              className="numeric text-5xl font-medium"
            />
            {isBp && diastolic !== null ? (
              <>
                <span className="text-3xl text-ink-subtle">/</span>
                <NumberFlow value={diastolic} transformTiming={FLOW_TIMING} spinTiming={FLOW_TIMING} className="numeric text-3xl font-medium text-ink-muted" />
              </>
            ) : null}
            <span className="text-sm text-ink-muted">{display.unit}</span>
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <Sparkline
          values={history}
          band={[limits.mildLow ?? limits.severeLow, limits.mildHigh ?? limits.severeHigh]}
          label={`${display.label}, last ${history.length} readings`}
          className={cn(
            status === "critical" ? "text-critical-solid" : status === "warning" ? "text-warning-solid" : "text-ink-muted",
          )}
        />
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
          <span>
            Normal {normalRange(limits, display.decimals)} {isBp ? "systolic" : display.unit}
          </span>
          {stale ? (
            <span className="font-medium text-warning">Out of date</span>
          ) : score && score.points > 0 && value !== null ? (
            <span className="flex items-center gap-1.5 font-medium">
              <StatusDot status={status} />
              {score.direction === "low" ? "Low" : "High"} · +{score.points} pt{score.points > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>
    </Tile>
  );
}
