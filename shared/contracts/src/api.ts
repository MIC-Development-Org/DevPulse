// DevPulse shared API communication contracts (Phase 3).
//
// The standardized error envelope every DevPulse HTTP surface uses:
//   backend middleware   ->  { error: string, details?: Record<string, string[]> }
//   Next.js BFF handlers ->  same shape, propagated
//   frontend HttpApiClient -> rejects with a typed ApiError carrying this
//
// Keeping the envelope in shared contracts means frontend, BFF and backend
// cannot drift apart on error shapes. Success responses contractually come
// from the feature-domain schemas (auth.ts today; Phase 4 business add
// theirs under src/business.ts).

import { z } from "zod";

export const ApiErrorEnvelopeSchema = z.object({
  /** Human-readable, client-safe message. Never contains internals. */
  error: z.string().min(1),
  /** Optional per-field validation messages (400 responses only). */
  details: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

/** Codes the HTTP client maps to typed errors; mirrors HTTP statuses. */
export const ApiErrorCodes = [
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "server_error",
  "network",
  "timeout",
  "bad_response",
] as const;
export type ApiErrorCode = (typeof ApiErrorCodes)[number];

/** HTTP status -> stable wire code, shared by client + BFF propagation. */
export function apiErrorCodeForStatus(status: number): ApiErrorCode | undefined {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "rate_limited";
    default:
      if (status >= 500) return "server_error";
      return undefined;
  }
}
