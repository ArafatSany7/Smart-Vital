"use client";

import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Moon : Sun;
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.8, filter: "blur(4px)" };

  return (
    <button
      type="button"
      className={button({ intent: "secondary", size: "icon" })}
      aria-label="Switch colour theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {hydrated ? (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={isDark ? "dark" : "light"}
            className="flex"
            initial={hidden}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={hidden}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      ) : (
        <>
          <Sun className="size-[18px] dark:hidden" aria-hidden="true" />
          <Moon className="hidden size-[18px] dark:block" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
