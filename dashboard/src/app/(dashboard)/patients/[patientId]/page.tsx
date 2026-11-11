import { Suspense } from "react";
import { PatientView } from "@/components/patients/patient-view";

export default function PatientPage({
  params,
}: PageProps<"/patients/[patientId]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ patientId }) => (
        <PatientView patientId={patientId} />
      ))}
    </Suspense>
  );
}
