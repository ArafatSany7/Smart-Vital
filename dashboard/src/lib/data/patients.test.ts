import { describe, expect, it } from "vitest";
import { authenticate, DEMO_PASSCODE } from "@/lib/auth/mock-auth";
import { CLINICIANS, createRoster } from "@/lib/vitals/roster";
import { RISK_ORDER } from "@/lib/vitals/types";
import {
  ALL_PATIENT_IDS,
  findPatientFor,
  getClinician,
  groupByRisk,
  listPatientsFor,
} from "./patients";

const [first, second] = CLINICIANS;

describe("roster", () => {
  it("has sixty patients with unique IDs P001 to P060", () => {
    expect(ALL_PATIENT_IDS).toHaveLength(60);
    expect(new Set(ALL_PATIENT_IDS).size).toBe(60);
    expect(ALL_PATIENT_IDS[0]).toBe("P001");
    expect(ALL_PATIENT_IDS[59]).toBe("P060");
  });

  it("is the same every time it is built", () => {
    expect(createRoster().patients).toEqual(createRoster().patients);
  });

  it("gives every patient at least one chronic condition", () => {
    for (const patient of createRoster().patients) {
      expect(patient.conditions.length).toBeGreaterThan(0);
      expect(patient.conditions.includes("Type 2 diabetes")).toBe(
        patient.diabetic,
      );
    }
  });

  it("gives every demo clinician patients in all three risk groups", () => {
    for (const clinician of CLINICIANS) {
      const groups = groupByRisk(listPatientsFor(clinician.id));
      for (const level of RISK_ORDER) {
        expect(groups[level].length, `${clinician.name}: ${level}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("access control (requirement 5)", () => {
  it("assigns every patient to exactly one clinician", () => {
    const seen = CLINICIANS.flatMap((clinician) =>
      listPatientsFor(clinician.id).map((patient) => patient.id),
    );
    expect(seen).toHaveLength(60);
    expect(new Set(seen).size).toBe(60);
  });

  it("lists only the signed-in clinician's own patients", () => {
    const patients = listPatientsFor(first.id);
    expect(patients).toHaveLength(20);
    expect(patients.every((patient) => patient.clinicianId === first.id)).toBe(
      true,
    );
  });

  it("lists nothing when nobody is signed in, or the ID is unknown", () => {
    expect(listPatientsFor(null)).toEqual([]);
    expect(listPatientsFor("C99")).toEqual([]);
  });

  it("returns a clinician's own patient", () => {
    const own = listPatientsFor(first.id)[0];
    expect(findPatientFor(first.id, own.id)).toEqual(own);
  });

  it("refuses another clinician's patient", () => {
    const theirs = listPatientsFor(second.id)[0];
    expect(findPatientFor(first.id, theirs.id)).toBeNull();
  });

  it("answers the same for a patient who does not exist", () => {
    expect(findPatientFor(first.id, "P999")).toBeNull();
    expect(findPatientFor(null, "P001")).toBeNull();
  });

  it("groups a caseload by risk without losing anyone", () => {
    const patients = listPatientsFor(first.id);
    const groups = groupByRisk(patients);
    const total = RISK_ORDER.reduce((sum, level) => sum + groups[level].length, 0);
    expect(total).toBe(patients.length);
    for (const level of RISK_ORDER) {
      expect(groups[level].every((patient) => patient.riskLevel === level)).toBe(true);
    }
  });
});

describe("mock sign-in", () => {
  it("accepts a known email with the demo passcode", () => {
    const result = authenticate(first.email, DEMO_PASSCODE);
    expect(result.ok && result.clinician.id).toBe(first.id);
  });

  it("ignores case and stray spaces in the email", () => {
    expect(authenticate(`  ${first.email.toUpperCase()} `, DEMO_PASSCODE).ok).toBe(true);
  });

  it("rejects a wrong passcode and an unknown email with the same message", () => {
    const wrongPasscode = authenticate(first.email, "nope");
    const unknownEmail = authenticate("nobody@medlink.example", DEMO_PASSCODE);
    expect(wrongPasscode.ok).toBe(false);
    expect(unknownEmail.ok).toBe(false);
    expect(!wrongPasscode.ok && wrongPasscode.error).toBe(
      !unknownEmail.ok && unknownEmail.error,
    );
  });

  it("finds a clinician by ID and returns null otherwise", () => {
    expect(getClinician(first.id)).toEqual(first);
    expect(getClinician("C99")).toBeNull();
    expect(getClinician(null)).toBeNull();
  });
});
