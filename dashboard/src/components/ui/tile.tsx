import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TileProps = HTMLAttributes<HTMLElement> & {
  index?: number;
};

export function Tile({ index = 0, className, style, ...props }: TileProps) {
  return (
    <section
      className={cn(
        "tile-enter rounded-tile border border-line bg-surface p-5 shadow-tile",
        className,
      )}
      style={{ "--i": index, ...style } as CSSProperties}
      {...props}
    />
  );
}

export function TileHeader({
  title,
  hint,
  className,
}: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <header className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="text-sm font-medium text-ink">{title}</h2>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </header>
  );
}
