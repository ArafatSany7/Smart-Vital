export const CANVAS_COLORS = {
  light: { primary: "#2a3d33", secondary: "#8b8a78" },
  dark: { primary: "#ece4d2", secondary: "#9b9a87" },
} as const;

export const TREND_VITALS = ["heartRate", "spo2", "systolicBp", "temperature", "glucose"] as const;

export type TrendVital = (typeof TREND_VITALS)[number];

export function formatAxisTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
