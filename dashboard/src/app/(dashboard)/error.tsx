"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-warning-line bg-warning-soft text-warning">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
        This screen stopped working
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Nothing has been lost. Try again, and if it keeps happening, reload the page.
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
