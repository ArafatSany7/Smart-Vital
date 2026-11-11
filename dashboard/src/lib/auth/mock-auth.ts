import { CLINICIANS } from "@/lib/vitals/roster";
import type { Clinician } from "@/lib/vitals/types";

export const DEMO_PASSCODE = "medlink-demo";

export type AuthResult =
  | { ok: true; clinician: Clinician }
  | { ok: false; error: string };

export function authenticate(email: string, passcode: string): AuthResult {
  const clinician = CLINICIANS.find(
    (candidate) => candidate.email === email.trim().toLowerCase(),
  );

  if (!clinician || passcode !== DEMO_PASSCODE) {
    return { ok: false, error: "That email or passcode is not right." };
  }
  return { ok: true, clinician };
}
