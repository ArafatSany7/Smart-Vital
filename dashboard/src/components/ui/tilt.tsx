"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const SPRING = { stiffness: 240, damping: 24, mass: 0.6 };

export function Tilt({
  children,
  className,
  max = 3.5,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduceMotion = useReducedMotion();
  const bounds = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glow = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), SPRING);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), SPRING);
  const glowOpacity = useSpring(glow, SPRING);
  const glowX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);
  const background = useMotionTemplate`radial-gradient(16rem circle at ${glowX} ${glowY}, color-mix(in oklch, var(--ink) 9%, transparent), transparent 65%)`;

  function handleEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduceMotion) return;
    bounds.current = event.currentTarget.getBoundingClientRect();
    glow.set(1);
  }

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const rect = bounds.current;
    if (!rect) return;
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    bounds.current = null;
    x.set(0);
    y.set(0);
    glow.set(0);
  }

  return (
    <motion.div
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn("relative rounded-tile", className)}
    >
      {children}
      <motion.span
        aria-hidden="true"
        style={{ background, opacity: glowOpacity }}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
      />
    </motion.div>
  );
}
