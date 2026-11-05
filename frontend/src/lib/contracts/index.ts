// DevPulse frontend contract surface.
//
// During the backend separation, the shared API schemas moved to the
// workspace package `@devpulse/contracts`. This module re-exports them so all
// existing frontend imports of `@/lib/contracts` keep working unchanged.
//
// The certificate schemas remain frontend-only: the certificates directory is
// a curated static feature with no backend endpoint today.
import { z } from "zod";
import { ModuleLevelSchema } from "@devpulse/contracts";

export * from "@devpulse/contracts";

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
