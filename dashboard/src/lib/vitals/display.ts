import type { VitalLimits } from "./rules";
import type { ScoredVitalKey } from "./types";

export interface VitalDisplay {
  key: ScoredVitalKey;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
}

export const VITAL_DISPLAY: Record<ScoredVitalKey, VitalDisplay> = {
  heartRate: { key: "heartRate", label: "Heart rate", shortLabel: "HR", unit: "bpm", decimals: 0 },
  spo2: { key: "spo2", label: "Blood oxygen", shortLabel: "SpO2", unit: "%", decimals: 1 },
  systolicBp: { key: "systolicBp", label: "Blood pressure", shortLabel: "BP", unit: "mmHg", decimals: 0 },
  temperature: { key: "temperature", label: "Temperature", shortLabel: "Temp", unit: "°C", decimals: 1 },
  glucose: { key: "glucose", label: "Blood glucose", shortLabel: "Glucose", unit: "mg/dL", decimals: 0 },
};

export function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export function normalRange(limits: VitalLimits, decimals: number): string {
  const low = limits.mildLow ?? limits.severeLow;
  const high = limits.mildHigh ?? limits.severeHigh;
  if (low !== undefined && high !== undefined) {
    return `${formatValue(low, decimals)}–${formatValue(high, decimals)}`;
  }
  if (low !== undefined) return `≥ ${formatValue(low, decimals)}`;
  if (high !== undefined) return `≤ ${formatValue(high, decimals)}`;
  return "any";
}

export function formatAgo(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
