"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { AlertToastCard } from "@/components/alerts/alert-toast";
import { useCaseload } from "@/hooks/use-caseload";
import { findPatientFor } from "@/lib/data/patients";
import { alertState, type Alert } from "@/lib/vitals/alerts";
import { useAlertPanel } from "@/stores/alert-panel";
import { onAlertEvent, useAlerts } from "@/stores/alerts";
import { useSession } from "@/stores/session";

const DOCK_ID = "critical-alerts";
const QUIET_AFTER_MS = 10_000;

function pendingAlerts(queue: string[]): Alert[] {
  const open = new Map(
    useAlerts
      .getState()
      .alerts.filter((alert) => alertState(alert) === "open")
      .map((alert) => [alert.id, alert]),
  );
  return queue.flatMap((id) => open.get(id) ?? []);
}

function signatureOf(pending: Alert[]): string {
  return pending.map((alert) => `${alert.id}:${alert.escalatedAt === null ? 0 : 1}`).join("|");
}

export function AlertNotifier() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { clinician } = useCaseload();
  const clinicianId = clinician?.id ?? null;
  const clinicianName = clinician?.name ?? "";

  useEffect(() => {
    let queue: string[] = [];
    let shown = "";

    const hide = () => {
      queue = [];
      shown = "";
    };

    const render = () => {
      const pending = pendingAlerts(queue);
      queue = pending.map((alert) => alert.id);
      const signature = signatureOf(pending);
      if (signature === shown) return;

      if (pending.length === 0) {
        shown = "";
        toast.dismiss(DOCK_ID);
        return;
      }

      const alert = pending.find((item) => item.escalatedAt !== null) ?? pending[0];
      const urgent = pending.some((item) => item.escalatedAt !== null);
      const patient = findPatientFor(useSession.getState().clinicianId, alert.patientId);
      shown = signature;

      toast.custom(
        () => (
          <AlertToastCard
            alert={alert}
            patient={patient}
            others={pending.length - 1}
            onClose={() => toast.dismiss(DOCK_ID)}
            onOpen={() => router.push(`/patients/${alert.patientId}`)}
            onAcknowledge={() =>
              useAlerts.getState().acknowledge(alert.id, clinicianName, Date.now())
            }
            onShowAll={() => {
              toast.dismiss(DOCK_ID);
              useAlertPanel.getState().setOpen(true);
            }}
          />
        ),
        {
          id: DOCK_ID,
          duration: urgent ? Number.POSITIVE_INFINITY : QUIET_AFTER_MS,
          onDismiss: hide,
          onAutoClose: hide,
        },
      );
    };

    const stopEvents = onAlertEvent((event) => {
      if (event.type !== "resolved" && !queue.includes(event.alert.id)) {
        queue = [event.alert.id, ...queue];
      }
      render();
    });

    const stopChanges = useAlerts.subscribe((state, previous) => {
      if (state.alerts !== previous.alerts && queue.length > 0) render();
    });

    return () => {
      stopEvents();
      stopChanges();
      toast.dismiss();
    };
  }, [router, clinicianId, clinicianName]);

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "light" ? "light" : "dark"}
      offset={{ bottom: 20, right: 20 }}
      mobileOffset={{ bottom: 16, right: 16, left: 16 }}
      visibleToasts={2}
      gap={10}
      containerAriaLabel="Notifications"
      toastOptions={{ unstyled: true }}
      style={{ "--width": "360px" } as React.CSSProperties}
    />
  );
}
