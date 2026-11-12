"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "@/stores/session";
import { useThresholdStore } from "@/stores/thresholds";

function SessionHydrator() {
  useEffect(() => {
    void Promise.all([
      useSession.persist.rehydrate(),
      useThresholdStore.persist.rehydrate(),
    ]).then(() => {
      useSession.setState({ hydrated: true });
    });
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <SessionHydrator />
        {children}
      </MotionConfig>
    </ThemeProvider>
  );
}
