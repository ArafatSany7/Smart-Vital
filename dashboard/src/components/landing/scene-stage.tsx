"use client";

import { useInView, useReducedMotion, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";

const VitalScene = dynamic(() => import("@/components/landing/vital-scene"), {
  ssr: false,
  loading: () => null,
});

let webglSupport: boolean | null = null;

function detectWebgl(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const noop = () => () => {};

function FallbackTrace() {
  return (
    <svg
      viewBox="0 0 640 120"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="absolute top-1/2 right-0 w-[min(56rem,90vw)] -translate-y-1/2 text-l-moss opacity-70"
    >
      <path
        d="M0 60 H70 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h26 q11 -20 24 0 H290 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h26 q11 -20 24 0 H510 l8 -7 l8 7 h18 l7 12 l11 -58 l11 72 l7 -26 h20"
        stroke="currentColor"
      />
    </svg>
  );
}

export function SceneStage({ progress }: { progress: MotionValue<number> }) {
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { margin: "200px 0px" });
  const reduced = useReducedMotion() ?? false;
  const webgl = useSyncExternalStore(noop, detectWebgl, () => false);

  return (
    <div ref={stage} className="pointer-events-auto absolute inset-0">
      {webgl ? (
        <VitalScene progress={progress} reduced={reduced} active={inView} />
      ) : (
        <FallbackTrace />
      )}
    </div>
  );
}
