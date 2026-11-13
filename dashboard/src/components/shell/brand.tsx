import Link from "next/link";
import { cn } from "@/lib/cn";

function BrandMark({ compact }: { compact: boolean }) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center bg-brand glow-brand rounded-xl">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12h4l2.5-6 4 12 3-9 1.5 3H22" />
        </svg>
      </span>
      <span className={cn("leading-tight", compact && "sr-only sm:not-sr-only")}>
        <span className="block text-sm font-semibold tracking-tight whitespace-nowrap text-ink">
          Smart Vitals
        </span>
        <span className="hidden text-xs whitespace-nowrap text-ink-subtle sm:block">
          MedLink Community Health
        </span>
      </span>
    </>
  );
}

export function Brand({
  href,
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  const classes = cn("flex items-center gap-3", className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
        )}
      >
        <BrandMark compact={compact} />
      </Link>
    );
  }
  return (
    <div className={classes}>
      <BrandMark compact={compact} />
    </div>
  );
}
