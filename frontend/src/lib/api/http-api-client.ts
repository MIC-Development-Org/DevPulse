import { z } from "zod";
import type {
  Track,
  ModuleDetail,
  PublicQuizQuestion,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
  ModuleProgressEntry,
  ProgressOverview,
  QuizAttemptHistory,
} from "../contracts";
import {
  ModuleDetailSchema,
  PublicQuizQuestionSchema,
  TrackListSchema,
  TrackSchema,
  QuizSubmissionSchema,
  QuizResultSchema,
  UserProfileSchema,
  ModuleProgressEntrySchema,
  ProgressOverviewSchema,
  QuizAttemptHistorySchema,
} from "@devpulse/contracts/src/shared-schemas";
import { CERTIFICATES } from "../data/mock-data";
import type { ApiClient } from "./api-client";
import { ApiError } from "./errors";
import { httpFetch } from "./http-client";

/**
 * HTTP adapter implementing the ApiClient interface against same-origin BFF
 * endpoints (Phase 4 content + Phase 5 user flows; the real DB-backed
 * Express serves these paths via the BFF proxies in app/api/business/*).
 *
 * Responses are validated with the shared contracts so frontend and backend
 * can never drift on payload shapes. Unknown resources (backend 404) surface
 * as `null`, exactly like the mock adapter; every other failure propagates —
 * browser code NEVER falls back to mock data on a failed real request.
 *
 * SECURITY (Phase 5): grading calls carry ONLY `{moduleId, answers}` —
 * scores/pass/completion are server-computed values that never travel to the
 * backend. Certificates remain a frontend-curated static resource (by design
 * decision, no backend endpoint).
 */

const TRACKS_PATH = "/api/business/tracks";
const TRACK_PATH = (slug: string) => `/api/business/tracks/${encodeURIComponent(slug)}`;
const MODULE_PATH = (trackSlug: string, moduleSlug: string) =>
  `/api/business/tracks/${encodeURIComponent(trackSlug)}/modules/${encodeURIComponent(moduleSlug)}`;
const PROFILE_PATH = "/api/business/me/profile";
const PROGRESS_PATH = "/api/business/me/progress";
const PROGRESS_START_PATH = (moduleId: string) =>
  `/api/business/me/progress/${encodeURIComponent(moduleId)}/start`;
const PROGRESS_RESET_PATH = "/api/business/me/progress/reset";
const QUIZ_QUESTIONS_PATH = (trackSlug: string, moduleSlug: string) =>
  `/api/business/tracks/${encodeURIComponent(trackSlug)}/modules/${encodeURIComponent(moduleSlug)}/quiz`;
const QUIZ_SUBMIT_PATH = "/api/business/quiz/submissions";
const QUIZ_ATTEMPTS_PATH = "/api/business/me/quiz/attempts";

/** URL/path-safe slug check so nothing odd reaches a route handler. */
function assertSlug(value: string, label: string): string {
  if (value.length === 0 || value.length > 120 || /[^\w-]/.test(value)) {
    throw new Error(`Invalid ${label} format.`);
  }
  return value;
}

/**
 * Unknown resources (backend 404) surface as `null`, mirroring the mock
 * adapter's shape. Every other failure propagates to the caller — no
 * silent fallbacks (Phase 4 requirement).
 */
async function fetchNullable<T>(
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>
): Promise<T | null> {
  try {
    return await httpFetch<T>(path, { schema });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export class HttpApiClient implements ApiClient {
  async getTracks(): Promise<Track[]> {
    return httpFetch(TRACKS_PATH, { schema: TrackListSchema });
  }

  async getTrackBySlug(slug: string): Promise<Track | null> {
    return fetchNullable(TRACK_PATH(assertSlug(slug, "track slug")), TrackSchema);
  }

  async getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleDetail | null> {
    return fetchNullable(
      MODULE_PATH(assertSlug(trackSlug, "track slug"), assertSlug(moduleSlug, "module slug")),
      ModuleDetailSchema
    );
  }

  async getUserProfile(): Promise<UserProfile> {
    return httpFetch(PROFILE_PATH, { schema: UserProfileSchema });
  }

  async startModule(moduleId: string): Promise<ModuleProgressEntry> {
    return httpFetch(PROGRESS_START_PATH(assertSlug(moduleId, "module id")), {
      method: "POST",
      schema: ModuleProgressEntrySchema,
    });
  }

  async getProgressOverview(): Promise<ProgressOverview> {
    return httpFetch(PROGRESS_PATH, { schema: ProgressOverviewSchema });
  }

  async getQuizQuestions(
    trackSlug: string,
    moduleSlug: string
  ): Promise<PublicQuizQuestion[]> {
    // PublicQuizQuestionSchema omits correctOptionIndex AND explanation at
    // contract level — grading truth can never reach the browser payload.
    return httpFetch(
      QUIZ_QUESTIONS_PATH(
        assertSlug(trackSlug, "track slug"),
        assertSlug(moduleSlug, "module slug")
      ),
      { schema: z.array(PublicQuizQuestionSchema) }
    );
  }

  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    const parsed = QuizSubmissionSchema.safeParse(submission);
    if (!parsed.success) {
      throw new Error("Invalid quiz submission");
    }
    return httpFetch(QUIZ_SUBMIT_PATH, {
      method: "POST",
      body: parsed.data,
      schema: QuizResultSchema,
    });
  }

  async getAttemptHistory(options: {
    moduleId?: string;
    limit?: number;
  } = {}): Promise<QuizAttemptHistory> {
    return httpFetch(QUIZ_ATTEMPTS_PATH, {
      schema: QuizAttemptHistorySchema,
      searchParams: {
        moduleId: options.moduleId,
        limit: options.limit,
      },
    });
  }

  async getCertificates(): Promise<CertificateResource[]> {
    // Frontend-curated static resource (by design); no backend endpoint.
    return CERTIFICATES;
  }

  async resetProgress(): Promise<UserProfile> {
    return httpFetch(PROGRESS_RESET_PATH, {
      method: "POST",
      schema: UserProfileSchema,
    });
  }
}
