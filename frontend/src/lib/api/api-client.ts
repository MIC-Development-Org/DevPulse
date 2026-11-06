import type {
  Track,
  ModuleDetail,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
  PublicQuizQuestion,
  ModuleProgressEntry,
  ProgressOverview,
  QuizAttemptHistory,
} from "../contracts";

/**
 * The application-facing API surface. All pages/components consume `api`
 * from this module (unchanged import path) — the concrete adapter behind it
 * is selected in adapter.ts (Phase 3; fully-real user flows since Phase 5).
 *
 * Phase 5 identity rules: profile/progress/grading endpoints are
 * authenticated server-side — the browser sends ONLY domain payloads
 * (`{moduleId, answers}` for grading); scores/pass/completion computed by
 * the server can never be submitted (compare QuizSubmissionSchema).
 */
export interface ApiClient {
  getTracks(): Promise<Track[]>;
  getTrackBySlug(slug: string): Promise<Track | null>;
  getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleDetail | null>;
  /** Signed-in profile composed by the backend (identity + derived stats). */
  getUserProfile(): Promise<UserProfile>;
  /** Records engagement for an UNLOCKED module (locked → 403 from backend). */
  startModule(moduleId: string): Promise<ModuleProgressEntry>;
  /** Whole-map progress for the calling user (server-derived statuses). */
  getProgressOverview(): Promise<ProgressOverview>;
  /** Returns the module's public questions (no answer keys); empty array when
   * the module has no authored bank. Addressed by slug pair (Phase 4). */
  getQuizQuestions(trackSlug: string, moduleSlug: string): Promise<PublicQuizQuestion[]>;
  /** Grades `{moduleId, answers}` server-side; everything else is ignored. */
  submitQuiz(submission: QuizSubmission): Promise<QuizResult>;
  /** Own attempt history (latest first, optional module filter + limit). */
  getAttemptHistory(options?: { moduleId?: string; limit?: number }): Promise<QuizAttemptHistory>;
  getCertificates(): Promise<CertificateResource[]>;
  /** Wipes the caller's progress/attempt rows server-side. */
  resetProgress(): Promise<UserProfile>;
}

// Adapter selection (mock vs HTTP) lives in adapter.ts; the pure flag
// primitives live in selection.ts. Re-exported here so the existing
// "./api/api-client" import path keeps working everywhere.
export { api } from "./adapter";
export { isMockAdapterActive } from "./selection";
export type { MockSelection } from "./selection";
