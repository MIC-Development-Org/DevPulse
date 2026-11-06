"use client";

import * as React from "react";
import { getApiMode } from "@/lib/api/selection";

/**
 * Honest mock-state indicator (approved Phase 3 decision: mock behavior must
 * be explicit, never silent). Phase 5: the hybrid mode is FULLY live —
 * content, user profiles, progress and grading all stream from the real
 * DB-backed API (green chip). The amber "Mock data" chip remains only for
 * mock flag builds used in UI-only development.
 */
export function MockDataBanner() {
  const [mode, setMode] = React.useState<string | null>(null);

  // Read after mount so build-time inlined flags don't cause hydration
  // mismatches: server render and client hydration agree on "hidden".
  React.useEffect(() => {
    setMode(getApiMode());
  }, []);

  if (mode === null) return null;

  if (mode === "mock") {
    return (
      <div
        aria-label="Mock data mode active"
        className="fixed bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 backdrop-blur-md"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Mock data
      </div>
    );
  }

  return (
    <div
      aria-label="Live API mode active: real DB-backed content and user flows"
      className="fixed bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400/80 backdrop-blur-md"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
      Live API · real progress
    </div>
  );
}
