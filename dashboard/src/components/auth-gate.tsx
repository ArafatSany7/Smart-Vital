"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getClinician } from "@/lib/data/patients";
import { useSession } from "@/stores/session";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useSession((state) => state.hydrated);
  const signedIn = useSession(
    (state) => getClinician(state.clinicianId) !== null,
  );
  const ready = hydrated && signedIn;

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/login");
  }, [hydrated, signedIn, router]);

  return (
    <div className={ready ? undefined : "invisible"} aria-busy={!ready}>
      {children}
    </div>
  );
}
