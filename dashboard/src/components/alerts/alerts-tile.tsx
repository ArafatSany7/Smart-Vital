"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AlertRow } from "@/components/alerts/alert-row";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { alertState } from "@/lib/vitals/alerts";
import { useAlerts } from "@/stores/alerts";

const PAGE = 4;

export function AlertsTile({
  patientId,
  index,
  className,
}: {
  patientId: string;
  index: number;
  className?: string;
}) {
  const { clinician } = useCaseload();
  const all = useAlerts((state) => state.alerts);
  const [shown, setShown] = useState(PAGE);
  const alerts = all
    .filter((alert) => alert.patientId === patientId)
    .sort((a, b) => {
      const rank = (state: string) => (state === "open" ? 0 : 1);
      return rank(alertState(a)) - rank(alertState(b)) || b.startedAt - a.startedAt;
    });
  const open = alerts.filter((alert) => alertState(alert) === "open").length;

  return (
    <Tile index={index} className={cn("flex min-h-60 flex-col xl:relative", className)}>
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">Alerts</h2>
        <p className="text-xs text-ink-subtle">
          {alerts.length === 0
            ? "None in the last 30 minutes"
            : `${open} open · ${alerts.length} total`}
        </p>
      </header>

      <motion.div
        layoutScroll
        className="mt-3 max-h-[26rem] overflow-y-auto pr-1 xl:absolute xl:inset-x-5 xl:top-12 xl:bottom-5 xl:mt-0 xl:max-h-none"
      >
        {alerts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            An alert is raised the moment a reading is Critical. One alert covers a whole episode,
            and it resolves after three calm readings in a row.
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {alerts.slice(0, shown).map((alert) => (
                <motion.li
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                >
                  <AlertRow alert={alert} clinicianName={clinician?.name ?? ""} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {shown < alerts.length ? (
          <div className="mt-2 flex justify-center">
            <Button intent="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
              Show older alerts
            </Button>
          </div>
        ) : null}
      </motion.div>
    </Tile>
  );
}
