import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  trailing?: ReactNode;
  invalid?: boolean;
};

export function TextField({
  label,
  trailing,
  invalid,
  className,
  ...props
}: TextFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-surface px-3 text-base text-ink",
            "placeholder:text-ink-subtle",
            "transition-[border-color] duration-150 ease-out",
            "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent",
            invalid ? "border-critical-line" : "border-line-strong",
            trailing ? "pr-12" : null,
          )}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
