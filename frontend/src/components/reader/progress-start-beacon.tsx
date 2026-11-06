"use client";

import * as React from "react";
import { api } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/errors";

/**
 * Progress-start beacon (Phase 5 decision — "module start" clarification):
 *
 * Opening a module's reader records engagement with the server
 * (POST /me/progress/:moduleId/start). Opening NEVER completes a module and
 * never introduces a new status; the backend refreshes the activity
 * timestamp of the UNLOCKED row (or creates it).
 *
 * Failure policy: the reader is public content.
 *  - 401 (guest)          → expected, silently skipped (no progress exists);
 *  - 403 (locked module)  → expected, silently skipped (direct navigation);
 *  - anything else        → reported to the console, never surfaced as UI
 *                           noise for a background beacon.
 * The POST is idempotent server-side, so React StrictMode's double-mount is
 * harmless.
 */
export function ProgressStartBeacon({ moduleId }: { moduleId: string }) {
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await api.startModule(moduleId);
      } catch (error) {
        if (cancelled) return;
        const status = error instanceof ApiError ? error.status : undefined;
        if (status !== 401 && status !== 403) {
          console.error(
            "[devpulse progress-start]",
            moduleId,
            status ?? "unexpected error"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  return null;
}
