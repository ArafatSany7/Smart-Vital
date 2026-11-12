"use client";

import { Slider } from "@base-ui/react/slider";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";
import { scoreVital, type VitalLimits } from "@/lib/vitals/rules";
import {
  fromSliderValues,
  LIMIT_LABEL,
  limitKeys,
  SLIDER_RANGE,
  toSliderValues,
} from "@/lib/vitals/threshold-editor";
import type { ScoredVitalKey } from "@/lib/vitals/types";

const ZONE_CLASS = ["bg-line-strong", "bg-warning-solid/70", "bg-critical-solid/75"];

function zones(vital: ScoredVitalKey, limits: VitalLimits) {
  const { min, max } = SLIDER_RANGE[vital];
  const edges = [min, ...toSliderValues(vital, limits), max];
  const out: { left: number; width: number; level: number }[] = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const from = edges[i];
    const to = edges[i + 1];
    if (to <= from) continue;
    const points = scoreVital(vital, (from + to) / 2, limits).points;
    out.push({
      left: ((from - min) / (max - min)) * 100,
      width: ((to - from) / (max - min)) * 100,
      level: points === 0 ? 0 : points === 1 ? 1 : 2,
    });
  }
  return out;
}

export function ThresholdSlider({
  vital,
  limits,
  changed,
  onChange,
  onReset,
}: {
  vital: ScoredVitalKey;
  limits: VitalLimits;
  changed: boolean;
  onChange: (limits: VitalLimits) => void;
  onReset: () => void;
}) {
  const display = VITAL_DISPLAY[vital];
  const { min, max, step } = SLIDER_RANGE[vital];
  const keys = limitKeys(vital);
  const values = toSliderValues(vital, limits);
  const label = vital === "systolicBp" ? "Systolic blood pressure" : display.label;

  return (
    <section className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
          {label}
          <span className="text-xs font-normal text-ink-subtle">{display.unit}</span>
          {changed ? (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              Custom
            </span>
          ) : null}
        </h3>
        {changed ? (
          <Button intent="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Default
          </Button>
        ) : null}
      </div>

      <Slider.Root
        value={values}
        min={min}
        max={max}
        step={step}
        minStepsBetweenValues={1}
        thumbCollisionBehavior="none"
        onValueChange={(next) => onChange(fromSliderValues(vital, next as number[]))}
        className="mt-3"
      >
        <Slider.Control className="relative flex h-9 w-full touch-none items-center select-none">
          <Slider.Track className="relative h-2 w-full overflow-hidden rounded-full bg-inset">
            {zones(vital, limits).map((zone, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={cn("absolute inset-y-0", ZONE_CLASS[zone.level])}
                style={{ left: `${zone.left}%`, width: `${zone.width}%` }}
              />
            ))}
          </Slider.Track>
          {keys.map((key, index) => (
            <Slider.Thumb
              key={key}
              index={index}
              getAriaLabel={() => `${label}: ${LIMIT_LABEL[key]} limit`}
              getAriaValueText={(formatted) => `${formatted} ${display.unit}`}
              className={cn(
                "size-5 cursor-grab rounded-full border-2 border-ink bg-surface shadow-tile",
                "transition-[transform,translate,scale,box-shadow] duration-150 ease-out-strong",
                "active:scale-110 active:cursor-grabbing has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              )}
            />
          ))}
        </Slider.Control>
      </Slider.Root>

      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {keys.map((key) => (
          <div key={key} className="flex gap-1.5">
            <dt className="text-ink-muted">{LIMIT_LABEL[key]}</dt>
            <dd className="numeric font-medium text-ink">
              {formatValue(limits[key] as number, display.decimals)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
