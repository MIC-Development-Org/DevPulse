"use client";

import * as React from "react";
import { isMockAdapterActive } from "@/lib/api/selection";

/**
 * Fixed "MOCK DATA" indicator rendered whenever the mock API adapter is
 * active (approved Phase 3 decision: mock behavior must be explicit, never
 * silent). In real production the adapter guard (adapter.ts) throws and
 * mock cannot be selected without the e2e-only escape hatch, so this banner
 * appears in development and sanctioned test builds.
 */
export function MockDataBanner() {
  if (!isMockAdapterActive()) return null;

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
