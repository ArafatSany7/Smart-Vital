"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { AlertToastCard } from "@/components/alerts/alert-toast";
import { useCaseload } from "@/hooks/use-caseload";
import { findPatientFor } from "@/lib/data/patients";
import type { Alert } from "@/lib/vitals/alerts";
import { onAlertEvent, useAlerts } from "@/stores/alerts";
import { useSession } from "@/stores/session";

export function AlertNotifier() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { clinician } = useCaseload();
  const clinicianId = clinician?.id ?? null;
  const clinicianName = clinician?.name ?? "";

  useEffect(() => {
    const visible = new Set<string>();
    const forget = (toastItem: { id: string | number }) => visible.delete(String(toastItem.id));

    const show = (alert: Alert, duration: number) => {
      visible.add(alert.id);
      const patient = findPatientFor(useSession.getState().clinicianId, alert.patientId);
      toast.custom(
        (id) => (
          <AlertToastCard
            alert={alert}
            patient={patient}
            onClose={() => toast.dismiss(id)}
            onOpen={() => {
              router.push(`/patients/${alert.patientId}`);
            }}
            onAcknowledge={() => {
              useAlerts.getState().acknowledge(alert.id, clinicianName, Date.now());
              toast.dismiss(id);
            }}
          />
        ),
        { id: alert.id, duration, onDismiss: forget, onAutoClose: forget },
      );
    };

    const stopEvents = onAlertEvent((event) => {
      if (event.type === "resolved") {
        if (visible.has(event.alert.id)) show(event.alert, 6000);
        return;
      }
      show(event.alert, event.type === "escalated" ? Number.POSITIVE_INFINITY : 12000);
    });

    const stopAcks = useAlerts.subscribe((state, previous) => {
      const before = new Map(previous.alerts.map((alert) => [alert.id, alert.acknowledgedAt]));
      for (const alert of state.alerts) {
        if (alert.acknowledgedAt !== null && before.get(alert.id) === null) toast.dismiss(alert.id);
      }
    });

    return () => {
      stopEvents();
      stopAcks();
      toast.dismiss();
    };
  }, [router, clinicianId, clinicianName]);

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "light" ? "light" : "dark"}
      offset={{ bottom: 20, right: 20 }}
      mobileOffset={{ bottom: 16, right: 16, left: 16 }}
      visibleToasts={3}
      gap={10}
      containerAriaLabel="Critical alerts"
      toastOptions={{ unstyled: true }}
      style={{ "--width": "380px" } as React.CSSProperties}
    />
  );
}
