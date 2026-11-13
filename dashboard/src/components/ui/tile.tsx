import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TileProps = HTMLAttributes<HTMLElement> & {
  index?: number;
  glass?: boolean;
};

export function Tile({ index = 0, glass = true, className, style, ...props }: TileProps) {
  return (
    <section
      className={cn(
        glass && "glass",
        "tile-enter rounded-tile border border-line p-5",
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
      <h2 className="font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">{title}</h2>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </header>
  );
}
