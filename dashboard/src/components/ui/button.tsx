import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const button = cva(
  [
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2",
    "rounded-xl text-sm font-medium whitespace-nowrap",
    "transition-[transform,translate,scale,background-color,border-color,color,filter] duration-150 ease-out-strong",
    "active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      intent: {
        primary: "bg-brand glow-brand hover:brightness-110",
        secondary:
          "border border-line-strong bg-surface/60 text-ink hover:bg-surface",
        ghost: "text-ink-muted hover:bg-inset hover:text-ink",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        icon: "size-11",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export function Button({
  className,
  intent,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(button({ intent, size }), className)}
      {...props}
    />
  );
}
