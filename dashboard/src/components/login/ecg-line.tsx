const TRACE =
  "M0 60 H70 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h26 q11 -20 24 0 " +
  "H290 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h26 q11 -20 24 0 " +
  "H510 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h20";

export function EcgLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 120"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={TRACE} className="stroke-line-strong" />
      <path d={TRACE} pathLength={1} className="ecg-trace stroke-accent" />
    </svg>
  );
}
