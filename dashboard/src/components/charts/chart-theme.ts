export const CANVAS_COLORS = {
  light: { primary: "#007a83", secondary: "#7c8594" },
  dark: { primary: "#4fd1cf", secondary: "#8b94a3" },
} as const;

export const TREND_VITALS = ["heartRate", "spo2", "systolicBp", "temperature", "glucose"] as const;

export type TrendVital = (typeof TREND_VITALS)[number];

export function formatAxisTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
