import type {
  Track,
  ModuleDetail,
  PublicQuizQuestion,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
} from "../contracts";
import type { ApiClient } from "./api-client";
import { HttpApiClient } from "./http-api-client";
import { MockApiClient } from "./mock-api-client";

/**
 * Phase 4 hybrid adapter.
 *
 * Migrated flows (tracks, modules, quiz retrieval) are served exclusively by
 * the real DB-backed HTTP API. User-scoped flows (profile, quiz grading,
 * progress/reset) stay on the Phase 2 mock stack until their phase ships;
 * certificates remain a static frontend resource by design.
 *
 * NO FALLBACK: every migrated call is delegated straight to the HTTP client.
 * If a real request fails, the error propagates to the caller — the mock
 * layer is never consulted as a silent substitute.
 */
export class HybridApiClient implements ApiClient {
  private readonly http = new HttpApiClient();
  private readonly mock = new MockApiClient();

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

  // --- Phase-boundary flows (mock until Phase 5) --------------------------

  getUserProfile(): Promise<UserProfile> {
    return this.mock.getUserProfile();
  }

  updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.mock.updateUserProfile(updates);
  }

  submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return this.mock.submitQuiz(submission);
  }

  getCertificates(): Promise<CertificateResource[]> {
    return this.mock.getCertificates();
  }

  resetProgress(): Promise<UserProfile> {
    return this.mock.resetProgress();
  }
}
