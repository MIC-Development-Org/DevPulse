// DevPulse shared API contracts (frontend <-> backend boundary).
//
// Moved verbatim from frontend/src/lib/contracts/index.ts during the backend
// separation, minus the certificate schemas, which are a frontend-curated
// feature (static directory, no backend endpoint) and remain in the frontend.
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

export const QuizQuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
  hint: z.string(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

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
