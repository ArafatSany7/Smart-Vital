"use client";

import { useMemo } from "react";
import {
  getClinician,
  groupByRisk,
  listPatientsFor,
} from "@/lib/data/patients";
import { useSession } from "@/stores/session";

export function useCaseload() {
  const clinicianId = useSession((state) => state.clinicianId);

  return useMemo(() => {
    const patients = listPatientsFor(clinicianId);
    return {
      clinician: getClinician(clinicianId),
      patients,
      groups: groupByRisk(patients),
    };
  }, [clinicianId]);
}
