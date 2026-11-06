import type {
  Track,
  ModuleDetail,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
  PublicQuizQuestion,
} from "../contracts";

/**
 * The application-facing API surface. All pages/components consume `api`
 * from this module (unchanged import path) — the concrete adapter behind it
 * is selected in adapter.ts (Phase 3; hybrid since Phase 4).
 */
export interface ApiClient {
  getTracks(): Promise<Track[]>;
  getTrackBySlug(slug: string): Promise<Track | null>;
  getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleDetail | null>;
  getUserProfile(): Promise<UserProfile>;
  updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  /** Returns the module's public questions (no answer keys); empty array when
   * the module has no authored bank. Addressed by slug pair (Phase 4). */
  getQuizQuestions(trackSlug: string, moduleSlug: string): Promise<PublicQuizQuestion[]>;
  submitQuiz(submission: QuizSubmission): Promise<QuizResult>;
  getCertificates(): Promise<CertificateResource[]>;
  resetProgress(): Promise<UserProfile>;
}

// Adapter selection (mock vs HTTP) lives in adapter.ts; the pure flag
// primitives live in selection.ts. Re-exported here so the existing
// "./api/api-client" import path keeps working everywhere.
export { api } from "./adapter";
export { isMockAdapterActive } from "./selection";
export type { MockSelection } from "./selection";
