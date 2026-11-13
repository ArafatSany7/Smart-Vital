"use client";

import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFeed } from "@/stores/feed";

const BUSY_MS = 30_000;

export function SimulateButton({ patientId }: { patientId: string }) {
  const deteriorate = useFeed((state) => state.deteriorate);
  const running = useFeed((state) => state.running);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), BUSY_MS);
    return () => window.clearTimeout(timer);
  }, [busy]);

  return (
    <Button
      intent="ghost"
      size="sm"
      disabled={busy || !running}
      title="Demo control. Makes this simulated patient deteriorate over the next few readings, so you can show an alert."
      onClick={() => {
        deteriorate(patientId);
        setBusy(true);
      }}
    >
      <FlaskConical className="size-4" aria-hidden="true" />
      {busy ? "Deteriorating…" : "Simulate deterioration"}
    </Button>
  );
}
