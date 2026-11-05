"use client";

import * as React from "react";

/**
 * Platform-aware keyboard modifier label.
 * Defaults to "Ctrl" (truthful on Windows/Linux and during SSR) and swaps to
 * "⌘" on Apple devices after mount — no hydration mismatch.
 */
export function useModKey(): string {
  const [mod, setMod] = React.useState("Ctrl");
  React.useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/Mac|iPhone|iPad|iPod/i.test(ua)) setMod("⌘");
  }, []);
  return mod;
}
