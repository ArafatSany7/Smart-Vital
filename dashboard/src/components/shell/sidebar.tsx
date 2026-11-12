"use client";

import { LayoutGrid, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar, RiskBars } from "@/components/patients/patient-bits";
import { Brand } from "@/components/shell/brand";
import { StatusDot } from "@/components/ui/status";
import { usePatientStatus } from "@/hooks/use-patient-feed";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { RISK_LABEL, RISK_ORDER } from "@/lib/vitals/types";

function RowStatus({ patientId }: { patientId: string }) {
  const status = usePatientStatus(patientId);
  if (!status || status === "normal") return null;
  return (
    <span className="flex items-center pr-1.5" title={`Latest reading: ${status}`}>
      <StatusDot status={status} />
      <span className="sr-only">Latest reading {status}</span>
    </span>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-12 items-center gap-3 rounded-xl px-2",
        "transition-[transform,background-color] duration-150 ease-out-strong",
        "active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        !active && "hover:bg-inset/60",
      )}
    >
      {active ? (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl border border-line bg-inset"
          transition={{ type: "spring", duration: 0.25, bounce: 0 }}
        />
      ) : null}
      <span className="relative flex min-w-0 flex-1 items-center gap-3">
        {children}
      </span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-surface/70 lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Brand href="/" />
      </div>
      <Suspense fallback={<div className="flex-1" />}>
        <PatientNav />
      </Suspense>
      <footer className="flex shrink-0 items-start gap-2 border-t border-line px-5 py-4 text-xs text-ink-subtle">
        <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
        <p>Simulated data only. No real patient data is used.</p>
      </footer>
    </aside>
  );
}

function PatientNav() {
  const pathname = usePathname();
  const { patients, groups } = useCaseload();

  return (
      <motion.nav
        layoutScroll
        aria-label="Your patients"
        className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-4"
      >
        <SidebarLink href="/" active={pathname === "/"}>
          <span className="flex size-9 shrink-0 items-center justify-center text-ink-muted">
            <LayoutGrid className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-medium text-ink">Overview</span>
          <span className="numeric pr-1 text-xs text-ink-subtle">
            {patients.length}
          </span>
        </SidebarLink>
        {RISK_ORDER.map((level) => (
          <section key={level} aria-labelledby={`risk-${level}`}>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <h2
                id={`risk-${level}`}
                className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-subtle uppercase"
              >
                <RiskBars level={level} />
                {RISK_LABEL[level]}
              </h2>
              <span className="numeric pr-1 text-xs text-ink-subtle">
                {groups[level].length}
              </span>
            </div>
            {groups[level].length === 0 ? (
              <p className="px-2 py-2 text-xs text-ink-subtle">
                No patients in this group.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {groups[level].map((patient) => (
                  <li key={patient.id}>
                    <SidebarLink
                      href={`/patients/${patient.id}`}
                      active={pathname === `/patients/${patient.id}`}
                    >
                      <Avatar name={patient.name} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-medium text-ink">
                          {patient.name}
                        </span>
                        <span className="block truncate font-mono text-xs text-ink-subtle">
                          {patient.id}
                        </span>
                      </span>
                      <RowStatus patientId={patient.id} />
                    </SidebarLink>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </motion.nav>
  );
}
