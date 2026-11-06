// DevPulse shared API contracts (frontend <-> backend boundary).
//
// SECURITY LAYOUT (Phase 5, decision D6): the browser-safe surface lives in
// `./shared-schemas` and exports everything EXCEPT the authored quiz bank
// schema below. Next.js client code imports that surface directly
// (`@devpulse/contracts/src/shared-schemas`), which structurally keeps the
// grading-truth schema out of browser bundles — webpack cannot prove zod
// builder calls pure, so a dead-but-included statement inside one big barrel
// once shipped the answer-key property name into a client chunk (proved by
// scripts/check-production-bundle.mjs). The backend keeps importing the full
// set from `@devpulse/contracts` and remains the only re-combiner of the
// authoring schema with the public contracts.
//
// Moved verbatim from frontend/src/lib/contracts/index.ts during the backend
// separation, minus the certificate schemas, which are a frontend-curated
// feature (static directory, no backend endpoint) and remain in the frontend.
import { z } from "zod";

// Everything client-safe (auth, http envelope, tracks/modules, quiz
// submission/result/progress contracts).
export * from "./shared-schemas";

/** The ONLY schema on the server-restricted side of the boundary.
 * Authored question bank row — `correctOptionIndex` is the answer key.
 * Client bundles import from `./shared-schemas` and can never reach this. */
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
