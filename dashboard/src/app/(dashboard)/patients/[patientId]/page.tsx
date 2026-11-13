import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { PatientView } from "@/components/patients/patient-view";

export default function PatientPage({
  params,
}: PageProps<"/patients/[patientId]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ patientId }) => (
        <PageTransition id={patientId}>
          <PatientView patientId={patientId} />
        </PageTransition>
      ))}
    </Suspense>
  );
}
