import { z } from "zod";
// Like every runtime plane under src/lib/api, the transport reaches the
// shared package only through the browser-safe surface (D6 — see
// shared-schemas.ts); the server barrel with the bank schema stays unreachable.
import type { ApiErrorEnvelope } from "@devpulse/contracts/src/shared-schemas";
import {
  ApiError,
  ApiSchemaError,
  apiErrorFromNetworkFailure,
  apiErrorFromStatus,
  apiErrorFromTimeout,
  isAbortError,
} from "./errors";

/**
 * DevPulse HTTP transport (Phase 3) — a small, typed fetch wrapper.
 *
 * Deliberately NOT a framework: JSON serialize/parse, optional Zod response
 * validation, standardized error-envelope mapping (shared contracts),
 * network failure + timeout handling, and status-safe logging.
 *
 * Boundary invariants (also asserted by tests/unit/security-boundaries):
 *  - same-origin relative paths only — browser code never talks to Express
 *    directly and never learns BACKEND_INTERNAL_URL;
 *  - it NEVER attaches authentication material — identity is the BFF's job
 *    (see lib/bff.ts, which forwards the HttpOnly session cookie server-side);
 *  - logs contain method + path + status only; bodies/tokens are never logged.
 */

export const DEFAULT_TIMEOUT_MS = 15_000;

const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;
export type HttpFetchMethod = (typeof METHODS)[number];

export interface HttpFetchOptions<T> {
  method?: HttpFetchMethod;
  /** Plain JSON-serializable body. Serialized exactly once here. */
  body?: unknown;
  /** Zod schema for BYO response contract. Input is `unknown` because
   * schemas with `.default()` have optional inputs — typing the param as
   * `z.ZodType<T>` (input defaults to output) would wrongly reject those. */
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>;
  timeoutMs?: number;
  /** Optional query parameters; `undefined` values are dropped. */
  searchParams?: Record<string, string | number | boolean | undefined>;
  /** Test- or caller-injected disjoint signal; combined with the timeout. */
  signal?: AbortSignal;
}

/** Same-origin guard: absolute URLs and protocol-relative URLs are rejected. */
function assertSameOriginPath(path: string): void {
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("\\\\")) {
    throw new ApiError("API calls must use same-origin BFF paths.", {
      code: "bad_request",
    });
  }
}

function buildUrl(
  path: string,
  searchParams?: HttpFetchOptions<never>["searchParams"]
): string {
  if (!searchParams) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}${path.includes("?") ? "&" : "?"}${query}` : path;
}

/** Best-effort envelope parse of a non-2xx body; null when unreadable. */
async function parseErrorEnvelope(
  response: Response
): Promise<ApiErrorEnvelope | null> {
  try {
    const raw: unknown = await response.json();
    if (
      typeof raw === "object" &&
      raw !== null &&
      typeof (raw as { error?: unknown }).error === "string"
    ) {
      const body = raw as { error: string; details?: unknown };
      const details =
        typeof body.details === "object" && body.details !== null
          ? Object.fromEntries(
              Object.entries(body.details as Record<string, unknown>).map(
                ([field, value]) => [
                  field,
                  Array.isArray(value) ? value.map(String) : [String(value)],
                ]
              )
            )
          : undefined;
      return { error: body.error, details };
    }
    return null;
  } catch {
    return null;
  }
}

async function parseSuccessBody<T>(
  response: Response,
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>
): Promise<T> {
  if (response.status === 204) {
    if (schema) {
      // A schema was demanded but the transport cannot validate an empty body.
      throw new ApiSchemaError([], response.status);
    }
    return undefined as T;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    throw new ApiError("The API returned a malformed response body.", {
      code: "bad_response",
      status: response.status,
      cause: error,
    });
  }

  if (!schema) return raw as T;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiSchemaError(
      parsed.error.issues.map((issue) =>
        issue.path.length > 0 ? issue.path.join(".") : "(root)"
      ),
      response.status
    );
  }
  return parsed.data;
}

/**
 * Typed HTTP call to a same-origin BFF endpoint.
 *
 * @returns the schema-validated (or raw) JSON value.
 * @throws ApiError (network | timeout | status-specific | bad_response) or
 *         ApiSchemaError when an explicit schema does not match.
 */
export async function httpFetch<T>(
  path: string,
  options: HttpFetchOptions<T> = {}
): Promise<T> {
  assertSameOriginPath(path);

  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(path, options.searchParams);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        accept: "application/json",
        ...(options.body !== undefined
          ? { "content-type": "application/json" }
          : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: "same-origin", // only our own first-party session cookie
      cache: "no-store",
    });
  } catch (error) {
    if (isAbortError(error)) throw apiErrorFromTimeout(timeoutMs);
    throw apiErrorFromNetworkFailure(error);
  }

  if (!response.ok) {
    // Log failures with safe fields only: method + path (no query) + status.
    console.error("[devpulse http]", method, url.split("?")[0], response.status);
    const envelope = await parseErrorEnvelope(response);
    throw apiErrorFromStatus(response.status, envelope);
  }

  return parseSuccessBody<T>(response, options.schema);
}
