import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "Smart Vitals · Remote patient monitoring",
  description:
    "A remote patient monitoring prototype for MedLink Community Health Trust. Simulated data only.",
};

export default function HomePage() {
  return (
    <PageTransition>
      <LandingPage />
    </PageTransition>
  );
}
