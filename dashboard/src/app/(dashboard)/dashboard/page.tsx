import { PageTransition } from "@/components/page-transition";
import { CaseloadOverview } from "@/components/patients/caseload-overview";

export default function OverviewPage() {
  return (
    <PageTransition>
      <CaseloadOverview />
    </PageTransition>
  );
}
