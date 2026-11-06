import { z } from "zod";
import type {
  Track,
  ModuleMeta,
  QuizQuestion,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
} from "../contracts";
import {
  TrackSchema,
  ModuleMetaSchema,
  QuizQuestionSchema,
  QuizSubmissionSchema,
  QuizResultSchema,
  UserProfileSchema,
} from "@devpulse/contracts";
import { CERTIFICATES } from "../data/mock-data";
import type { ApiClient } from "./api-client";
import { httpFetch } from "./http-client";

/**
 * HTTP adapter implementing the ApiClient interface against same-origin BFF
 * endpoints. Responses are validated with the shared contracts so frontend
 * and backend can never drift on payload shapes.
 *
 * Phase 3 boundary: these endpoint paths are the Phase-4 BFF contract, but
 * the handlers/backend endpoints will only start serving them in Phase 4
 * (business APIs excluded from Phase 3 by design). The mock adapter stays
 * selected for the app until those flows ship — see adapter.ts.
 *
 * Certificates are intentionally NOT an HTTP call: they are a frontend-
 * curated static resource by architecture decision (no backend endpoint),
 * so this adapter delegates to the shared static set.
 */

const TRACKS_PATH = "/api/business/tracks";
const TRACK_PATH = (slug: string) => `/api/business/tracks/${encodeURIComponent(slug)}`;
const MODULE_PATH = (trackSlug: string, moduleSlug: string) =>
  `/api/business/tracks/${encodeURIComponent(trackSlug)}/modules/${encodeURIComponent(moduleSlug)}`;
const PROFILE_PATH = "/api/business/me/profile";
const QUIZ_QUESTIONS_PATH = (moduleId: string) =>
  `/api/business/modules/${encodeURIComponent(moduleId)}/quiz/questions`;
const QUIZ_SUBMIT_PATH = "/api/business/quiz/submissions";
const PROGRESS_RESET_PATH = "/api/business/me/progress/reset";

/** URL/path-safe slug check so nothing odd reaches a route handler. */
function assertSlug(value: string, label: string): string {
  if (value.length === 0 || value.length > 120 || /[^\w-]/.test(value)) {
    throw new Error(`Invalid ${label} format.`);
  }
  return value;
}

export class HttpApiClient implements ApiClient {
  async getTracks(): Promise<Track[]> {
    return httpFetch(TRACKS_PATH, {
      schema: z.array(TrackSchema),
    });
  }

  async getTrackBySlug(slug: string): Promise<Track | null> {
    const track = await httpFetch<Track | null>(TRACK_PATH(assertSlug(slug, "track slug")), {
      schema: TrackSchema.nullable(),
    });
    return track;
  }

  async getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleMeta | null> {
    return httpFetch<ModuleMeta | null>(
      MODULE_PATH(assertSlug(trackSlug, "track slug"), assertSlug(moduleSlug, "module slug")),
      { schema: ModuleMetaSchema.nullable() }
    );
  }

  async getUserProfile(): Promise<UserProfile> {
    const profile = await httpFetch(PROFILE_PATH, {
      schema: UserProfileSchema,
    });
    return profile;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await httpFetch(PROFILE_PATH, {
      method: "PATCH",
      body: updates,
      schema: UserProfileSchema,
    });
    return profile;
  }

  async getQuizQuestions(moduleId: string): Promise<Omit<QuizQuestion, "correctOptionIndex">[]> {
    // The answer key is never serialized to the client: the contract omits it.
    const schema = QuizQuestionSchema.omit({ correctOptionIndex: true });
    return httpFetch(QUIZ_QUESTIONS_PATH(assertSlug(moduleId, "module id")), {
      schema: z.array(schema),
    });
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

  async getCertificates(): Promise<CertificateResource[]> {
    // Frontend-curated static resource (by design); no backend endpoint.
    return CERTIFICATES;
  }

  async resetProgress(): Promise<UserProfile> {
    const profile = await httpFetch(PROGRESS_RESET_PATH, {
      method: "POST",
      schema: UserProfileSchema,
    });
    return profile;
  }
}
