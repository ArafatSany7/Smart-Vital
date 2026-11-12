"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-xl border border-line bg-inset p-1", className)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const index = options.findIndex((option) => option.value === value);
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = options[(index + step + options.length) % options.length];
        onChange(next.value);
        const target = event.currentTarget.querySelector<HTMLButtonElement>(
          `[data-value="${next.value}"]`,
        );
        target?.focus();
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative h-9 cursor-pointer rounded-lg px-3 text-sm font-medium whitespace-nowrap",
              "transition-[color,transform,scale] duration-150 ease-out-strong active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segment-${id}`}
                className="absolute inset-0 rounded-lg border border-line bg-surface shadow-tile"
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
