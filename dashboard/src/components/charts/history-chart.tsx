"use client";

import { Ban, Check, Clock, OctagonAlert, TriangleAlert, Unplug } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisTime, type TrendVital } from "@/components/charts/chart-theme";
import { cn } from "@/lib/cn";
import { formatClock, formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import type { HistoryEntry } from "@/lib/vitals/feed";
import { DEFAULT_THRESHOLDS, scoreVital } from "@/lib/vitals/rules";
import type { Status } from "@/lib/vitals/types";

interface Row {
  t: number;
  v: number | null;
  d: number | null;
  status: Status;
  late: boolean;
  rejected: boolean;
}

const STATUS_FILL: Record<Status, string> = {
  normal: "var(--ink-subtle)",
  warning: "var(--warning-solid)",
  critical: "var(--critical-solid)",
};

const STATUS_META: Record<Status, { label: string; Icon: typeof Check; tone: string }> = {
  normal: { label: "Normal", Icon: Check, tone: "text-ink-muted" },
  warning: { label: "Warning", Icon: TriangleAlert, tone: "text-warning" },
  critical: { label: "Critical", Icon: OctagonAlert, tone: "text-critical" },
};

function toRows(history: HistoryEntry[], vital: TrendVital): Row[] {
  return history.map((entry) => {
    const value = entry.reading[vital];
    return {
      t: entry.reading.timestamp,
      v: value,
      d: vital === "systolicBp" ? entry.reading.diastolicBp : null,
      status: value === null ? "normal" : scoreVital(vital, value).status,
      late: entry.late,
      rejected: entry.rejected.includes(vital),
    };
  });
}

function domainFor(rows: Row[], vital: TrendVital): [number, number] {
  const limits = DEFAULT_THRESHOLDS[vital];
  const values: number[] = [];
  for (const row of rows) {
    if (row.v !== null) values.push(row.v);
    if (row.d !== null) values.push(row.d);
  }
  for (const limit of [limits.severeLow, limits.severeHigh, limits.mildLow, limits.mildHigh]) {
    if (limit !== undefined) values.push(limit);
  }
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.08, vital === "temperature" ? 0.2 : 1);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

function StatusDotMark(props: { cx?: number; cy?: number; payload?: Row; index?: number }) {
  const { cx, cy, payload, index } = props;
  if (cx === undefined || cy === undefined || !payload || payload.v === null || payload.status === "normal") {
    return <g key={`dot-${index}`} />;
  }
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill={STATUS_FILL[payload.status]}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
}

function ChartTooltip({
  active,
  payload,
  vital,
}: {
  active?: boolean;
  payload?: readonly { payload?: Row }[];
  vital: TrendVital;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const display = VITAL_DISPLAY[vital];
  const meta = STATUS_META[row.status];

  return (
    <div className="min-w-44 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-tile">
      <p className="text-ink-muted">{formatClock(row.t)}</p>
      {row.v === null ? (
        <p className="mt-1.5 flex items-center gap-1.5 font-medium text-ink-muted">
          {row.rejected ? <Ban className="size-3.5" aria-hidden="true" /> : <Unplug className="size-3.5" aria-hidden="true" />}
          {row.rejected ? "Impossible value rejected" : "No signal"}
        </p>
      ) : (
        <>
          <p className="numeric mt-1 text-base font-medium text-ink">
            {formatValue(row.v, display.decimals)}
            {row.d !== null ? <span className="text-ink-muted">/{row.d}</span> : null}{" "}
            <span className="text-xs font-normal text-ink-muted">{display.unit}</span>
          </p>
          <p className={cn("mt-1 flex items-center gap-1.5 font-medium", meta.tone)}>
            <meta.Icon className="size-3.5" aria-hidden="true" />
            {meta.label}
          </p>
        </>
      )}
      {row.late ? (
        <p className="mt-1 flex items-center gap-1.5 text-ink-muted">
          <Clock className="size-3.5" aria-hidden="true" />
          Arrived late
        </p>
      ) : null}
    </div>
  );
}

export function HistoryChart({ vital, history }: { vital: TrendVital; history: HistoryEntry[] }) {
  const lineCount = vital === "systolicBp" ? 2 : 1;
  const [finished, setFinished] = useState(0);
  const animate = finished < lineCount;
  const onLineDrawn = () => setFinished((count) => count + 1);
  const rows = toRows(history, vital);
  const limits = DEFAULT_THRESHOLDS[vital];
  const display = VITAL_DISPLAY[vital];
  const [yMin, yMax] = domainFor(rows, vital);
  const bandLow = limits.mildLow ?? limits.severeLow ?? yMin;
  const bandHigh = limits.mildHigh ?? limits.severeHigh ?? yMax;
  const tick = { fill: "var(--ink-subtle)", fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <ReferenceArea y1={bandLow} y2={bandHigh} fill="var(--ink)" fillOpacity={0.05} ifOverflow="hidden" />
        {limits.severeLow !== undefined ? (
          <ReferenceLine
            y={limits.severeLow}
            stroke="var(--critical-solid)"
            strokeOpacity={0.7}
            strokeDasharray="4 4"
          />
        ) : null}
        {limits.severeHigh !== undefined ? (
          <ReferenceLine
            y={limits.severeHigh}
            stroke="var(--critical-solid)"
            strokeOpacity={0.7}
            strokeDasharray="4 4"
          />
        ) : null}
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatAxisTime}
          tick={tick}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={tick}
          axisLine={false}
          tickLine={false}
          width={44}
          allowDecimals={vital === "temperature" || vital === "spo2"}
        />
        <Tooltip
          cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          isAnimationActive={false}
          content={(props) => <ChartTooltip active={props.active} payload={props.payload as readonly { payload?: Row }[]} vital={vital} />}
        />
        {vital === "systolicBp" ? (
          <Line
            dataKey="d"
            name="Diastolic"
            type="linear"
            stroke="var(--ink-subtle)"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={animate}
            animationDuration={700}
            animationEasing="ease-out"
            onAnimationEnd={onLineDrawn}
          />
        ) : null}
        <Line
          dataKey="v"
          name={vital === "systolicBp" ? "Systolic" : display.label}
          type="linear"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={StatusDotMark}
          activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
          connectNulls={false}
          isAnimationActive={animate}
          animationDuration={700}
          animationEasing="ease-out"
          onAnimationEnd={onLineDrawn}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
