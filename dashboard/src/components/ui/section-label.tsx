import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase",
        className,
      )}
    >
      {index ? <span className="text-l-clay">{index}</span> : null}
      {index ? <span aria-hidden="true" className="h-px w-6 bg-line-strong" /> : null}
      {children}
    </p>
  );
}
