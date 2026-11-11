import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/cn";

export function PlaceholderTile({
  index,
  title,
  note,
  className,
}: {
  index?: number;
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <Tile
      index={index}
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-1 border-dashed border-line-strong bg-transparent text-center shadow-none",
        className,
      )}
    >
      <p className="text-sm font-medium text-ink-muted">{title}</p>
      {note ? <p className="text-xs text-ink-subtle">{note}</p> : null}
    </Tile>
  );
}
