// DevPulse frontend contract surface.
//
// During the backend separation, the shared API schemas moved to the
// workspace package `@devpulse/contracts`. This module re-exports their TYPES
// so all existing frontend imports of `@/lib/contracts` keep working
// unchanged.
//
// SECURITY (Phase 5, decision D6): the re-export is TYPE-ONLY. The shared
// package's `index.ts` contains runtime Zod schemas — including
// QuizQuestionSchema, whose very definition mentions the answer-key property
// (`correctOptionIndex`). A runtime `export *` here pulled the whole schema
// barrel into client chunks. Type-only re-exports are fully erased at
// compile time, so browser bundles receive zero contracts-package code from
// this module; the artifacts scanner (scripts/check-production-bundle.mjs)
// proves that invariant on every production build.
//
// The certificate schemas below remain frontend-only runtime values: the
// certificates directory is a curated static feature with no backend
// endpoint today.
import { z } from "zod";
import { ModuleLevelSchema } from "@devpulse/contracts";

export type * from "@devpulse/contracts";

export const CertificateCategorySchema = z.enum(["Web", "Cloud", "Git", "Security", "Blockchain", "AI"]);
export type CertificateCategory = z.infer<typeof CertificateCategorySchema>;

export const CertificateResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  provider: z.string(),
  category: CertificateCategorySchema,
  difficulty: ModuleLevelSchema,
  estimatedTime: z.string(),
  cost: z.enum(["Free", "Audit Free", "Free Verification"]),
  pairedModuleSlug: z.string().optional(),
  pairedModuleTitle: z.string().optional(),
  url: z.string().url(),
  description: z.string(),
  skills: z.array(z.string()),
});
export type CertificateResource = z.infer<typeof CertificateResourceSchema>;
