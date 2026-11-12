import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/vitals/rules";
import { isDefaultThresholds } from "@/lib/vitals/threshold-editor";

export interface ThresholdOverride {
  thresholds: Thresholds;
  updatedAt: number;
  updatedBy: string;
}

interface ThresholdState {
  overrides: Record<string, ThresholdOverride>;
  save: (patientId: string, thresholds: Thresholds, by: string, at: number) => void;
  reset: (patientId: string) => void;
}

export const useThresholdStore = create<ThresholdState>()(
  persist(
    (set) => ({
      overrides: {},
      save: (patientId, thresholds, by, at) =>
        set((state) => {
          const overrides = { ...state.overrides };
          if (isDefaultThresholds(thresholds)) delete overrides[patientId];
          else overrides[patientId] = { thresholds, updatedAt: at, updatedBy: by };
          return { overrides };
        }),
      reset: (patientId) =>
        set((state) => {
          const overrides = { ...state.overrides };
          delete overrides[patientId];
          return { overrides };
        }),
    }),
    {
      name: "smart-vitals-thresholds",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export function thresholdsFor(patientId: string): Thresholds {
  return useThresholdStore.getState().overrides[patientId]?.thresholds ?? DEFAULT_THRESHOLDS;
}

export function usePatientThresholds(patientId: string): Thresholds {
  return useThresholdStore(
    (state) => state.overrides[patientId]?.thresholds ?? DEFAULT_THRESHOLDS,
  );
}

export function useThresholdOverride(patientId: string): ThresholdOverride | null {
  return useThresholdStore((state) => state.overrides[patientId] ?? null);
}
