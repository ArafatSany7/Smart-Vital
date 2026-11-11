import { Rng } from "./random";
import { createProfile, type SimulationProfile } from "./simulator";
import type { Clinician, Patient, RiskLevel } from "./types";

export const CLINICIANS: readonly Clinician[] = [
  {
    id: "C01",
    name: "Dr Amara Okafor",
    role: "Consultant cardiologist",
    email: "amara.okafor@medlink.example",
  },
  {
    id: "C02",
    name: "Dr Daniel Whitfield",
    role: "Consultant diabetologist",
    email: "daniel.whitfield@medlink.example",
  },
  {
    id: "C03",
    name: "Priya Raman",
    role: "Advanced nurse practitioner",
    email: "priya.raman@medlink.example",
  },
];

const FIRST_NAMES = [
  "Agnes", "Bashir", "Carys", "Desmond", "Edith", "Farid", "Gwen", "Harold",
  "Imani", "Jasper", "Kavita", "Leon", "Mabel", "Nikhil", "Olive", "Piotr",
  "Queenie", "Rashid", "Sunita", "Tobias", "Una", "Victor", "Winifred", "Yusuf",
] as const;

const LAST_NAMES = [
  "Adeyemi", "Barrow", "Chowdhury", "Dalton", "Ellwood", "Farrow", "Gallagher",
  "Hossain", "Ingram", "Joshi", "Kowalczyk", "Lindqvist", "Mbeki", "Norwood",
  "Osei", "Pemberton", "Quayle", "Ramsden", "Sandhu", "Thackeray", "Underhill",
  "Varga", "Wainwright", "Yeboah",
] as const;

const AGE_RANGE: Record<RiskLevel, [number, number]> = {
  low: [34, 68],
  medium: [45, 79],
  high: [56, 89],
};

function pickRisk(rng: Rng): RiskLevel {
  const draw = rng.next();
  if (draw < 0.5) return "low";
  if (draw < 0.8) return "medium";
  return "high";
}

function pickConditions(
  riskLevel: RiskLevel,
  diabetic: boolean,
  rng: Rng,
): string[] {
  const conditions = diabetic ? ["Type 2 diabetes"] : [];
  const others = rng.next() < 0.5
    ? ["Hypertension", "Cardiac arrhythmia"]
    : ["Cardiac arrhythmia", "Hypertension"];

  const target = riskLevel === "high" ? 2 : riskLevel === "medium" ? rng.int(1, 2) : 1;
  while (conditions.length < target) {
    conditions.push(others.shift() as string);
  }
  return conditions;
}

export interface Roster {
  patients: Patient[];
  profiles: Map<string, SimulationProfile>;
}

export function createRoster(seed = 42, count = 60): Roster {
  const clinical = new Rng(seed);
  const personal = new Rng(seed + 1);

  const patients: Patient[] = [];
  const profiles = new Map<string, SimulationProfile>();
  const usedNames = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const id = `P${String(index + 1).padStart(3, "0")}`;
    const riskLevel = pickRisk(clinical);
    const diabetic = clinical.next() < 0.35;
    profiles.set(id, createProfile(id, riskLevel, diabetic, clinical));

    let name: string;
    do {
      name = `${personal.choice(FIRST_NAMES)} ${personal.choice(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const [minAge, maxAge] = AGE_RANGE[riskLevel];
    patients.push({
      id,
      name,
      age: personal.int(minAge, maxAge),
      riskLevel,
      diabetic,
      conditions: pickConditions(riskLevel, diabetic, personal),
      clinicianId: CLINICIANS[index % CLINICIANS.length].id,
    });
  }

  return { patients, profiles };
}
