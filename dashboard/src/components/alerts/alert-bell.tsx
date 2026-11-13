"use client";

import { Popover } from "@base-ui/react/popover";
import NumberFlow from "@number-flow/react";
import { Bell } from "lucide-react";
import { AlertRow } from "@/components/alerts/alert-row";
import { button } from "@/components/ui/button";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { alertState } from "@/lib/vitals/alerts";
import { useAlertPanel } from "@/stores/alert-panel";
import { useAlerts } from "@/stores/alerts";

export function AlertBell() {
  const { clinician, patients } = useCaseload();
  const all = useAlerts((state) => state.alerts);
  const names = new Map(patients.map((patient) => [patient.id, patient.name]));
  const open = all
    .filter((alert) => alertState(alert) === "open")
    .sort((a, b) => b.startedAt - a.startedAt);
  const count = open.length;
  const panelOpen = useAlertPanel((state) => state.open);
  const setPanelOpen = useAlertPanel((state) => state.setOpen);

  return (
    <Popover.Root open={panelOpen} onOpenChange={setPanelOpen}>
      <Popover.Trigger
        aria-label={count === 0 ? "Alerts: none open" : `Alerts: ${count} open`}
        className={cn(button({ intent: "secondary", size: "icon" }), "relative")}
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-critical-solid px-1 text-[11px] font-semibold text-white dark:text-canvas">
            <NumberFlow value={count} className="numeric" />
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} className="z-50">
          <Popover.Popup
            className={cn(
              "w-[min(400px,calc(100vw-2rem))] glass-pop rounded-2xl border border-line p-3 outline-none",
              "origin-(--transform-origin) transition-[transform,translate,scale,opacity] duration-150 ease-out-strong",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-100",
            )}
          >
            <div className="flex items-baseline justify-between px-1 pb-2">
              <Popover.Title className="text-sm font-medium text-ink">Open alerts</Popover.Title>
              <Popover.Description className="text-xs text-ink-subtle">
                Your patients only
              </Popover.Description>
            </div>
            {count === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-ink-muted">
                Nothing needs acknowledging.
              </p>
            ) : (
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
                {open.map((alert) => (
                  <li key={alert.id}>
                    <AlertRow
                      alert={alert}
                      clinicianName={clinician?.name ?? ""}
                      showPatient
                      patientName={names.get(alert.patientId)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
