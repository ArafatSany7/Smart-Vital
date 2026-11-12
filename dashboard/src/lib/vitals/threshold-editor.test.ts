import { describe, expect, it } from "vitest";
import { classifyReading, DEFAULT_THRESHOLDS } from "./rules";
import {
  changedVitals,
  fromSliderValues,
  isDefaultThresholds,
  isValidLimits,
  limitKeys,
  toSliderValues,
} from "./threshold-editor";

describe("threshold editor (R10)", () => {
  it("lists only the limits each vital actually has", () => {
    expect(limitKeys("heartRate")).toEqual(["severeLow", "mildHigh", "severeHigh"]);
    expect(limitKeys("spo2")).toEqual(["severeLow", "mildLow"]);
    expect(limitKeys("systolicBp")).toEqual(["severeLow", "mildLow", "mildHigh", "severeHigh"]);
  });

  it("round-trips limits through slider values", () => {
    const values = toSliderValues("heartRate", DEFAULT_THRESHOLDS.heartRate);
    expect(values).toEqual([50, 100, 120]);
    expect(fromSliderValues("heartRate", values)).toEqual(DEFAULT_THRESHOLDS.heartRate);
  });

  it("keeps limits in order and snaps them to the slider step", () => {
    expect(fromSliderValues("temperature", [39.04, 35.46, 38.01])).toEqual({
      severeLow: 35.5,
      mildHigh: 38,
      severeHigh: 39,
    });
  });

  it("rejects limits out of range or out of order", () => {
    expect(isValidLimits("heartRate", DEFAULT_THRESHOLDS.heartRate)).toBe(true);
    expect(isValidLimits("heartRate", { severeLow: 50, mildHigh: 50, severeHigh: 120 })).toBe(false);
    expect(isValidLimits("heartRate", { severeLow: 5, mildHigh: 100, severeHigh: 120 })).toBe(false);
  });

  it("reports which vitals differ from the defaults", () => {
    expect(isDefaultThresholds(DEFAULT_THRESHOLDS)).toBe(true);
    const custom = { ...DEFAULT_THRESHOLDS, spo2: { severeLow: 86, mildLow: 90 } };
    expect(isDefaultThresholds(custom)).toBe(false);
    expect(changedVitals(custom)).toEqual(["spo2"]);
  });

  it("changes the classification once applied", () => {
    const reading = { heartRate: 72, spo2: 89, systolicBp: 120, temperature: 36.8, glucose: null };
    expect(classifyReading(reading).status).toBe("critical");
    const copd = { ...DEFAULT_THRESHOLDS, spo2: { severeLow: 86, mildLow: 90 } };
    expect(classifyReading(reading, copd).status).toBe("warning");
  });
});
