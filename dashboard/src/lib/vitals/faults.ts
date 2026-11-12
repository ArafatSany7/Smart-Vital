import type { Rng } from "./random";
import type { Reading, VitalKey } from "./types";

export const FAULT_RATES = {
  skip: 0.03,
  duplicate: 0.02,
  artefact: 0.01,
  late: 0.015,
  stallStart: 0.004,
};

export const STALL_TICKS: [number, number] = [6, 14];

const ARTEFACTS: { key: VitalKey; value: number }[] = [
  { key: "heartRate", value: 0 },
  { key: "heartRate", value: 312 },
  { key: "spo2", value: 0 },
  { key: "spo2", value: 127 },
  { key: "systolicBp", value: 0 },
  { key: "temperature", value: 4.2 },
];

export interface SensorState {
  stalledTicks: number;
  heldBack: Reading | null;
}

export function createSensorState(): SensorState {
  return { stalledTicks: 0, heldBack: null };
}

export function applyFaults(
  reading: Reading,
  state: SensorState,
  rng: Rng,
): { sent: Reading[]; state: SensorState } {
  if (state.stalledTicks > 0) {
    return { sent: [], state: { ...state, stalledTicks: state.stalledTicks - 1 } };
  }
  if (rng.next() < FAULT_RATES.stallStart) {
    return { sent: [], state: { ...state, stalledTicks: rng.int(...STALL_TICKS) } };
  }

  const sent: Reading[] = [];
  let heldBack = state.heldBack;

  if (heldBack && rng.next() < 0.5) {
    sent.push(heldBack);
    heldBack = null;
  }

  if (rng.next() < FAULT_RATES.skip) {
    return { sent, state: { ...state, heldBack } };
  }

  let outgoing = reading;
  if (rng.next() < FAULT_RATES.artefact) {
    const artefact = rng.choice(ARTEFACTS);
    outgoing = { ...reading, [artefact.key]: artefact.value };
  }

  if (!heldBack && rng.next() < FAULT_RATES.late) {
    return { sent, state: { ...state, heldBack: outgoing } };
  }

  sent.push(outgoing);
  if (rng.next() < FAULT_RATES.duplicate) sent.push(outgoing);

  return { sent, state: { ...state, heldBack } };
}
