// DevPulse shared API contracts — BROWSER-SAFE surface.
//
// SECURITY (Phase 5, decision D6): this module contains every contract the
// NEXT.JS CLIENT may import at runtime — and deliberately NOT the quiz bank
// schema (QuizQuestionSchema), whose very definition contains the answer-key
// property (`correctOptionIndex`). Client code imports from
// `@devpulse/contracts/src/shared-schemas` directly, so the graded-truth
// schema can never be pulled into a browser chunk, no matter how webpack's
// tree-shaking behaves (zod builders are calls webpack cannot prove pure, so
// dead statements inside an included barrel previously still shipped).
//
// The server barrel `src/index.ts` re-exports this module PLUS the
// graded-truth bank schema; backend code keeps importing `@devpulse/contracts`
// unchanged and stays the only consumer of grading truth.
import { z } from "zod";

// Authentication & authorization contracts (Phase 2).
export * from "./auth";

// HTTP communication contracts (Phase 3): shared error envelope + codes.
export * from "./api";

export const ModuleLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type ModuleLevel = z.infer<typeof ModuleLevelSchema>;

export const SourceCitationSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  license: z.string(),
  author: z.string().optional(),
});
export type SourceCitation = z.infer<typeof SourceCitationSchema>;

export const VideoChapterSchema = z.object({
  timestamp: z.string(),
  title: z.string(),
  seconds: z.number(),
});
export type VideoChapter = z.infer<typeof VideoChapterSchema>;

export const EmbeddedVideoSchema = z.object({
  title: z.string(),
  youtubeId: z.string(),
  channel: z.string(),
  license: z.string(),
  chapters: z.array(VideoChapterSchema),
});
export type EmbeddedVideo = z.infer<typeof EmbeddedVideoSchema>;

export const CheatSheetSnippetSchema = z.object({
  title: z.string(),
  code: z.string(),
  language: z.string(),
  explanation: z.string(),
});
export type CheatSheetSnippet = z.infer<typeof CheatSheetSnippetSchema>;

export const CheatSheetSchema = z.object({
  title: z.string(),
  summary: z.string(),
  snippets: z.array(CheatSheetSnippetSchema),
});
export type CheatSheet = z.infer<typeof CheatSheetSchema>;

export const ModuleMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  trackId: z.string(),
  trackSlug: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  level: ModuleLevelSchema,
  estimatedMinutes: z.number(),
  prerequisites: z.array(z.string()),
  learningOutcomes: z.array(z.string()),
  sources: z.array(SourceCitationSchema),
  video: EmbeddedVideoSchema.optional(),
  cheatSheet: CheatSheetSchema.optional(),
  hasGitVisualizer: z.boolean().default(false),
});
export type ModuleMeta = z.infer<typeof ModuleMetaSchema>;

export const TrackSchema = z.object({
  id: z.string(),
  slug: z.string(),
  trackNumber: z.number(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  color: z.enum(["mint", "blue", "amber"]),
  hexAccent: z.string(),
  moduleCount: z.number(),
  estimatedHours: z.number(),
  level: ModuleLevelSchema,
  icon: z.string(),
  modules: z.array(ModuleMetaSchema),
});
export type Track = z.infer<typeof TrackSchema>;

// NOTE: `QuizQuestionSchema` (authored quiz bank, includes the answer key)
// intentionally does NOT live here. See the security comment above.

export const QuizConfigSchema = z.object({
  passPercentage: z.number().default(80),
  questionsPerAttempt: z.number().default(8),
});
export type QuizConfig = z.infer<typeof QuizConfigSchema>;

export const QuizSubmissionSchema = z.object({
  moduleId: z.string(),
  answers: z.record(z.string(), z.number()), // questionId -> selectedOptionIndex
});
export type QuizSubmission = z.infer<typeof QuizSubmissionSchema>;

export const TopicBreakdownSchema = z.object({
  topic: z.string(),
  correct: z.number(),
  total: z.number(),
  percentage: z.number(),
});
export type TopicBreakdown = z.infer<typeof TopicBreakdownSchema>;

export const MissedTopicSchema = z.object({
  topic: z.string(),
  explanation: z.string(),
  reviewConcept: z.string(),
});
export type MissedTopic = z.infer<typeof MissedTopicSchema>;

export const QuizResultSchema = z.object({
  submissionId: z.string(),
  moduleId: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  passMarkPercentage: z.number(),
  topicBreakdown: z.array(TopicBreakdownSchema),
  missedTopics: z.array(MissedTopicSchema),
  unlockedNextModuleId: z.string().nullable(),
  message: z.string(),
});
export type QuizResult = z.infer<typeof QuizResultSchema>;

export const BadgeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  trackId: z.string().optional(),
  unlockedAt: z.string().nullable(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
  avatarUrl: z.string(),
  streakDays: z.number(),
  completedModuleIds: z.array(z.string()),
  unlockedModuleIds: z.array(z.string()),
  currentModuleId: z.string(),
  quizScores: z.record(z.string(), z.number()), // moduleId -> highest score percentage
  weeklyActivity: z.record(z.string(), z.number()), // ISO date string -> activity level 0..4
  badges: z.array(BadgeSchema),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ---------------------------------------------------------------------------
// Public learning-content API contracts (Phase 4: database-backed tracks and
// modules).
//
// PostgreSQL is authoritative for existence, ids, relationships and ordering;
// shared/curriculum remains the editorial content source; Express composes
// both server-side. These public response schemas are shape-compatible with
// the curriculum schemas above, so consumer pages render identically.
//
// SECURITY: the public quiz contract omits `correctOptionIndex` AND
// `explanation` at contract level — answer keys and explanations only
// re-enter through graded results in a later phase. An empty questions array
// means the module has no authored bank; there are no fallback banks.
// ---------------------------------------------------------------------------

/** GET /tracks/:trackSlug/modules — light, ordered module card. */
export const ModuleListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  trackId: z.string(),
  trackSlug: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  level: ModuleLevelSchema,
  estimatedMinutes: z.number(),
  hasGitVisualizer: z.boolean(),
  quizQuestionCount: z.number().min(0),
});
export type ModuleListItem = z.infer<typeof ModuleListItemSchema>;

/** GET /tracks/:trackSlug/modules/:moduleSlug — full module reader payload. */
export const ModuleDetailSchema = ModuleMetaSchema.extend({
  quizQuestionCount: z.number().min(0),
});
export type ModuleDetail = z.infer<typeof ModuleDetailSchema>;

/** GET /tracks and GET /tracks/:slug — nested modules (approved deviation:
 * hub, dashboard and track pages consume the full structure in one round
 * trip; switching to summaries would redesign those pages). */
export const TrackListSchema = z.array(TrackSchema);
export type TrackList = z.infer<typeof TrackListSchema>;
export const TrackDetailSchema = TrackSchema;
export type TrackDetail = z.infer<typeof TrackDetailSchema>;

/** GET /tracks/:trackSlug/modules/:moduleSlug/quiz — browser-safe question.
 *
 * SECURITY (Phase 5, decision D6): this schema is deliberately DECLARED
 * STANDALONE instead of derived via `QuizQuestionSchema.omit(...)`. A runtime
 * .omit() evaluation keeps the PARENT bank schema (whose definition contains
 * the answer-key property name `correctOptionIndex`) reachable from this
 * module, and duplication is safer than derivation here: the parity test
 * under backend/tests/unit/quiz-contracts asserts shape compatibility so the
 * two declarations can never silently drift.
 */
export const PublicQuizQuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  hint: z.string(),
});
export type PublicQuizQuestion = z.infer<typeof PublicQuizQuestionSchema>;
export const PublicQuizQuestionListSchema = z.array(PublicQuizQuestionSchema);
export type PublicQuizQuestionList = z.infer<typeof PublicQuizQuestionListSchema>;

// ---------------------------------------------------------------------------
// User-scoped progress & quiz submission contracts (Phase 5).
//
// Identity NEVER travels in these payloads: every endpoint they describe is
// authenticated, and the backend derives the caller exclusively from the
// validated database session (requireAuth -> req.authContext). A client can
// therefore never read or write another user's progress.
//
// Quiz submission (POST /me/quiz/submissions) consumes QuizSubmissionSchema
// above (moduleId + { questionId -> selectedOptionIndex }); the browser never
// submits scores, pass state, or completion status — grading truth re-enters
// ONLY through the authenticated QuizResultSchema response, where
// explanations are included for missed questions and never for correct ones.
// Locked modules are rejected by both the progress-start and the submission
// endpoints (see docs/api-contracts.md, Phase 5).
// ---------------------------------------------------------------------------

/** Mirrors the Prisma `ProgressStatus` enum (LOCKED | UNLOCKED | COMPLETED). */
export const ProgressStatusSchema = z.enum(["LOCKED", "UNLOCKED", "COMPLETED"]);
export type ProgressStatus = z.infer<typeof ProgressStatusSchema>;

/**
 * One module's progress as seen by the calling user (GET /me/progress).
 *
 *  - `status` is the server-derived unlock/completion state; modules without
 *    an authored quiz bank are still kept UNLOCKED/LOCKED by the chain rule
 *    but never become COMPLETED (no fabricated completion).
 *  - `bestScore` is the highest attempt percentage (null = no attempts).
 *  - `completedAt` is the FIRST passing attempt timestamp (stable across
 *    later attempts — retries never move it).
 *  - `updatedAt` is the last activity touch (progress start/upsert); null
 *    until the user has engaged with the module.
 *  - `attemptCount` is derived (attempt rows per user+module), never stored
 *    duplicated.
 */
export const ModuleProgressEntrySchema = z.object({
  moduleId: z.string(),
  status: ProgressStatusSchema,
  bestScore: z.number().min(0).max(100).nullable(),
  completedAt: z.string().nullable(),
  attemptCount: z.number().int().min(0),
  updatedAt: z.string().nullable(),
});
export type ModuleProgressEntry = z.infer<typeof ModuleProgressEntrySchema>;

/** GET /me/progress — whole-map overview for the calling user. */
export const ProgressOverviewSchema = z.object({
  entries: z.array(ModuleProgressEntrySchema),
  /** Server-side compose timestamp (audit/diagnostics only). */
  generatedAt: z.string(),
});
export type ProgressOverview = z.infer<typeof ProgressOverviewSchema>;

/**
 * GET /me/quiz/attempts — the calling user's persisted attempt history
 * (latest first). Deliberately light: `answers`/`breakdown` details stay in
 * the database (audit trail); summaries avoid re-serving grading material.
 */
export const QuizAttemptSummarySchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  score: z.number().int().min(0),
  total: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
  createdAt: z.string(),
});
export type QuizAttemptSummary = z.infer<typeof QuizAttemptSummarySchema>;
export const QuizAttemptHistorySchema = z.array(QuizAttemptSummarySchema);
export type QuizAttemptHistory = z.infer<typeof QuizAttemptHistorySchema>;
