import { describe, it, expect } from "vitest";
import {
  TrackSchema,
  ModuleMetaSchema,
  QuizQuestionSchema,
  QuizSubmissionSchema,
  QuizResultSchema,
  CertificateResourceSchema,
} from "@/lib/contracts";
import { TRACKS, CERTIFICATES } from "@/lib/data/mock-data";

describe("Zod Contracts & Data Integrity", () => {
  it("validates all Tracks against TrackSchema", () => {
    TRACKS.forEach((track) => {
      const parsed = TrackSchema.safeParse(track);
      expect(parsed.success, `Track ${track.id} validation failed`).toBe(true);
    });
  });

  it("validates all Modules against ModuleMetaSchema", () => {
    TRACKS.flatMap((t) => t.modules).forEach((mod) => {
      const parsed = ModuleMetaSchema.safeParse(mod);
      expect(parsed.success, `Module ${mod.id} validation failed`).toBe(true);
    });
  });

  it("validates all Certificates against CertificateResourceSchema", () => {
    CERTIFICATES.forEach((cert) => {
      const parsed = CertificateResourceSchema.safeParse(cert);
      expect(parsed.success, `Cert ${cert.id} validation failed`).toBe(true);
    });
  });

  it("rejects invalid quiz submissions with incorrect types", () => {
    const invalidSubmission = {
      moduleId: 123, // should be string
      answers: "not-an-object",
    };
    const parsed = QuizSubmissionSchema.safeParse(invalidSubmission);
    expect(parsed.success).toBe(false);
  });
});

