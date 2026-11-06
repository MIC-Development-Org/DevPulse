// Client code imports the BROWSER-SAFE surface (never the server barrel,
// which holds the quiz bank schema — see shared-schemas.ts security note).
import type { ApiErrorCode, ApiErrorEnvelope } from "@devpulse/contracts/src/shared-schemas";
import { apiErrorCodeForStatus } from "@devpulse/contracts/src/shared-schemas";

/**
 * Typed errors for the DevPulse HTTP communication layer (Phase 3).
 *
 * Every failure surfaces as `ApiError` carrying a stable `ApiErrorCode`
 * (shared contract), the HTTP status when applicable, and the parsed
 * standardized error envelope. Network failures and timeouts get their own
 * codes, so UI can render precise messages without string matching.
 *
 * Messages are client-safe only — they never embed response bodies,
 * tokens, or backend internals.
 */

export interface ApiErrorOptions {
  readonly code: ApiErrorCode;
  readonly status?: number | null;
  readonly envelope?: ApiErrorEnvelope | null;
  readonly cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;
  readonly envelope: ApiErrorEnvelope | null;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.envelope = options.envelope ?? null;
    if (options.cause !== undefined) {
      // Error cause keeps the original failure for diagnostics without
      // stringifying it into the client-facing message.
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/** Response failed 2xx — built from the standardized error envelope. */
export function apiErrorFromStatus(
  status: number,
  envelope: ApiErrorEnvelope | null
): ApiError {
  const code: ApiErrorCode = apiErrorCodeForStatus(status) ?? "bad_response";
  const message =
    envelope?.error ?? `The API responded with status ${status}.`;
  return new ApiError(message, { code, status, envelope });
}

/** 2xx body did not satisfy the expected Zod contract. */
export class ApiSchemaError extends Error {
  /** Compact, client-safe issue summary (paths only, no received values). */
  readonly issuePaths: string[];
  readonly status: number | null;

  constructor(issuePaths: string[], status: number | null) {
    const summary = issuePaths.length > 0 ? ` (${issuePaths.join(", ")})` : "";
    super(`The API response was not in the expected format${summary}.`);
    this.name = "ApiSchemaError";
    this.issuePaths = issuePaths;
    this.status = status;
  }
}

/** fetch itself failed (offline, DNS, CORS, connection refused). */
export function apiErrorFromNetworkFailure(cause: unknown): ApiError {
  return new ApiError("Unable to reach the API. Check your connection and try again.", {
    code: "network",
    cause,
  });
}

/** AbortController timeout elapsed before the response arrived. */
export function apiErrorFromTimeout(timeoutMs: number): ApiError {
  return new ApiError(
    `The API did not respond within ${Math.round(timeoutMs / 1000)} seconds. Please try again.`,
    { code: "timeout", cause: undefined }
  );
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    typeof error === "object" && error !== null && "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}
