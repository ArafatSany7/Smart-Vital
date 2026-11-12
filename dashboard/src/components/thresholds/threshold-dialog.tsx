"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ThresholdSlider } from "@/components/thresholds/threshold-slider";
import { Button, button } from "@/components/ui/button";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/vitals/display";
import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/vitals/rules";
import { isValidLimits, sameLimits } from "@/lib/vitals/threshold-editor";
import type { Patient, ScoredVitalKey } from "@/lib/vitals/types";
import { useFeed } from "@/stores/feed";
import { useThresholdOverride, useThresholdStore, usePatientThresholds } from "@/stores/thresholds";

function SavedToast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div
      role="status"
      className="flex w-[min(380px,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-tile"
    >
      <Check className="size-4 text-accent" aria-hidden="true" />
      <span className="flex-1">{text}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-ink-subtle hover:bg-inset hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ThresholdDialog({ patient }: { patient: Patient }) {
  const { clinician } = useCaseload();
  const current = usePatientThresholds(patient.id);
  const override = useThresholdOverride(patient.id);
  const save = useThresholdStore((state) => state.save);
  const reclassify = useFeed((state) => state.reclassify);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Thresholds>(current);

  const vitals: ScoredVitalKey[] = [
    "heartRate",
    "spo2",
    "systolicBp",
    "temperature",
    ...(patient.diabetic ? (["glucose"] as const) : []),
  ];
  const dirty = vitals.some((vital) => !sameLimits(draft[vital], current[vital]));
  const valid = vitals.every((vital) => isValidLimits(vital, draft[vital]));
  const allDefault = vitals.every((vital) => sameLimits(draft[vital], DEFAULT_THRESHOLDS[vital]));

  function handleSave() {
    save(patient.id, draft, clinician?.name ?? "Unknown", Date.now());
    reclassify(patient.id);
    setOpen(false);
    toast.custom(
      (id) => (
        <SavedToast
          text={`Thresholds saved for ${patient.id}. New readings use them now.`}
          onClose={() => toast.dismiss(id)}
        />
      ),
      { duration: 4000 },
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(current);
        setOpen(next);
      }}
    >
      <Dialog.Trigger className={button({ intent: "secondary", size: "sm" })}>
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Thresholds
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]",
            "transition-opacity duration-200 ease-out",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[88dvh] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-2xl border border-line bg-surface shadow-tile outline-none",
            "transition-[transform,translate,scale,opacity] duration-200 ease-out-strong",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold tracking-tight text-ink">
                Alert thresholds · <span className="font-mono">{patient.id}</span> {patient.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink-muted">
                Beyond the amber marks a reading scores 1 point, beyond the red marks 2 or 3.
                Three points or more is Critical and alerts you. Changes apply to new readings;
                the history keeps the status each reading had at the time.
              </Dialog.Description>
              {override ? (
                <p className="mt-2 text-xs text-ink-subtle">
                  Last changed by {override.updatedBy} at {formatClock(override.updatedAt)}
                </p>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className={button({ intent: "ghost", size: "icon", className: "-mt-1 -mr-2 shrink-0" })}
            >
              <X className="size-[18px]" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {vitals.map((vital) => (
              <ThresholdSlider
                key={vital}
                vital={vital}
                limits={draft[vital]}
                changed={!sameLimits(draft[vital], DEFAULT_THRESHOLDS[vital])}
                onChange={(limits) => setDraft((prev) => ({ ...prev, [vital]: limits }))}
                onReset={() => setDraft((prev) => ({ ...prev, [vital]: DEFAULT_THRESHOLDS[vital] }))}
              />
            ))}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <Button
              intent="ghost"
              size="sm"
              disabled={allDefault}
              onClick={() => setDraft(DEFAULT_THRESHOLDS)}
            >
              Reset all to defaults
            </Button>
            <div className="flex gap-2">
              <Dialog.Close className={button({ intent: "secondary", size: "sm" })}>Cancel</Dialog.Close>
              <Button size="sm" disabled={!dirty || !valid} onClick={handleSave}>
                Save thresholds
              </Button>
            </div>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
