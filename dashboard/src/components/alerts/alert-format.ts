import type { Alert, AlertVital } from "@/lib/vitals/alerts";
import { formatValue, VITAL_DISPLAY } from "@/lib/vitals/display";

export function describeVital(vital: AlertVital): string {
  const display = VITAL_DISPLAY[vital.key];
  const label = vital.key === "systolicBp" ? "Systolic BP" : display.shortLabel;
  return `${label} ${formatValue(vital.value, display.decimals)} ${display.unit} (${vital.direction}, +${vital.points})`;
}

export function alertHeadline(alert: Alert): string {
  return alert.trigger.map(describeVital).join(" · ");
}
