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
import type { ApiClient } from "./api-client";
import { HttpApiClient } from "./http-api-client";

/**
 * Hybrid adapter, Phase 5: EVERY application flow now runs live.
 *
 *  - Learning content (tracks/modules/questions) streams from the real
 *    DB-backed API (Phase 4).
 *  - User-scoped flows (profile, progress, quiz grading, attempt history,
 *    reset) are served by the authenticated /me endpoints (Phase 5): identity
 *    comes from the browser session cookie forwarded by the BFF, grading is
 *    computed by the server, and the answer keys never ship.
 *  - Certificates remain a frontend-curated static resource by design.
 *
 * NO FALLBACK: every call goes straight to the HTTP client; failures
 * propagate to the caller — the mock layer is never a silent substitute.
 * (Mock mode remains available only as a separate build via the Phase-3
 * flag while it keeps working for UI-only development.)
 */
export class HybridApiClient implements ApiClient {
  private readonly http = new HttpApiClient();

  getTracks(): Promise<Track[]> {
    return this.http.getTracks();
  }

  getTrackBySlug(slug: string): Promise<Track | null> {
    return this.http.getTrackBySlug(slug);
  }

  getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleDetail | null> {
    return this.http.getModuleBySlug(trackSlug, moduleSlug);
  }

  getQuizQuestions(trackSlug: string, moduleSlug: string): Promise<PublicQuizQuestion[]> {
    return this.http.getQuizQuestions(trackSlug, moduleSlug);
  }

  // --- Authenticated user flows (Phase 5) ---------------------------------

  getUserProfile(): Promise<UserProfile> {
    return this.http.getUserProfile();
  }

  startModule(moduleId: string): Promise<ModuleProgressEntry> {
    return this.http.startModule(moduleId);
  }

  getProgressOverview(): Promise<ProgressOverview> {
    return this.http.getProgressOverview();
  }

  submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return this.http.submitQuiz(submission);
  }

  getAttemptHistory(options?: { moduleId?: string; limit?: number }): Promise<QuizAttemptHistory> {
    return this.http.getAttemptHistory(options);
  }

  resetProgress(): Promise<UserProfile> {
    return this.http.resetProgress();
  }

  getCertificates(): Promise<CertificateResource[]> {
    // Static curated resource (by design) — no HTTP round-trip.
    return this.http.getCertificates();
  }
}
