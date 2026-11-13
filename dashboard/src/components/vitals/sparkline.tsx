import { cn } from "@/lib/cn";

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 3;

export function Sparkline({
  values,
  band,
  className,
  label,
}: {
  values: (number | null)[];
  band?: [number | undefined, number | undefined];
  className?: string;
  label: string;
}) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length < 2) {
    return <div className={cn("h-8", className)} aria-hidden="true" />;
  }

  const bandLow = band?.[0];
  const bandHigh = band?.[1];
  const candidates = [...present];
  if (bandLow !== undefined) candidates.push(bandLow);
  if (bandHigh !== undefined) candidates.push(bandHigh);
  let min = Math.min(...candidates);
  let max = Math.max(...candidates);
  if (max - min < 1e-6) {
    min -= 1;
    max += 1;
  }

  const x = (index: number) => (index / (values.length - 1)) * WIDTH;
  const y = (value: number) => PAD + (1 - (value - min) / (max - min)) * (HEIGHT - PAD * 2);

  let d = "";
  let open = false;
  values.forEach((value, index) => {
    if (value === null) {
      open = false;
      return;
    }
    d += `${open ? "L" : "M"}${x(index).toFixed(2)} ${y(value).toFixed(2)}`;
    open = true;
  });

  const lastIndex = values.findLastIndex((value) => value !== null);
  const last = values[lastIndex];
  const bandTop = y(bandHigh ?? max);
  const bandBottom = y(bandLow ?? min);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <rect
        x={0}
        y={bandTop}
        width={WIDTH}
        height={Math.max(0, bandBottom - bandTop)}
        className="fill-normal-solid/10"
      />
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-current opacity-80"
      />
      {last !== null && last !== undefined ? (
        <circle cx={x(lastIndex)} cy={y(last)} r={2.25} className="fill-current" />
      ) : null}
    </svg>
  );
}
