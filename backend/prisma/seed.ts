import { PrismaClient } from "@prisma/client";
import { QUIZ_BANKS, TRACKS } from "@devpulse/curriculum";

/**
 * Phase 1 + Phase 4 seed — curriculum structure and quiz banks.
 *
 * Source of truth: shared/curriculum (TRACKS / QUIZ_BANKS). Seeds exactly 3
 * tracks and 23 modules with the stable editorial ids ("track-0", "mod-1-2",
 * ...) so later phases can reference them from progress/attempts logic
 * without a lookup drift. Phase 4 additionally persists the authored quiz
 * banks into the QuizQuestion table (the server owns the answer keys).
 *
 * Idempotent: every row is upserted by its primary key, so re-running the
 * seed never creates duplicates — it refreshes values in place.
 *
 * Deliberately NOT seeded (per phase scope):
 * - users, quiz attempts, module progress (no fake data)
 * - lesson content / certificates (stay in code)
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Deterministic pass order: tracks by trackNumber, modules by order field.
  const sortedTracks = [...TRACKS].sort((a, b) => a.trackNumber - b.trackNumber);

  let moduleCount = 0;

  for (const track of sortedTracks) {
    await prisma.track.upsert({
      where: { id: track.id },
      update: {
        slug: track.slug,
        title: track.title,
        position: track.trackNumber,
      },
      create: {
        id: track.id,
        slug: track.slug,
        title: track.title,
        position: track.trackNumber,
      },
    });

    const sortedModules = [...track.modules].sort((a, b) => a.order - b.order);

    for (const mod of sortedModules) {
      const data = {
        slug: mod.slug,
        position: mod.order,
        // Per-module overrides keep the global QuizConfig (passPercentage: 80,
        // questionsPerAttempt: 8) as the default; individual modules can
        // relax or tighten these once authored.
      };

      await prisma.module.upsert({
        where: { id: mod.id },
        update: data,
        create: {
          id: mod.id,
          trackId: track.id,
          ...data,
        },
      });

      moduleCount += 1;
    }
  }

  // Phase 4: persist the authored quiz banks. Only banks that exist in
  // shared/curriculum are seeded; modules without a bank simply get no rows
  // (public quiz endpoints return an empty list — never placeholder or
  // fabricated questions). Upserting by the stable question id keeps ids and
  // authored ordering stable across re-runs.
  let questionCount = 0;
  for (const [moduleId, bank] of Object.entries(QUIZ_BANKS)) {
    const moduleRow = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleRow) {
      throw new Error(`Quiz bank references unknown module id "${moduleId}"`);
    }

    for (let index = 0; index < bank.length; index += 1) {
      const quizQuestion = bank[index];
      const data = {
        moduleId,
        position: index + 1,
        topic: quizQuestion.topic,
        question: quizQuestion.question,
        options: quizQuestion.options,
        correctOptionIndex: quizQuestion.correctOptionIndex,
        explanation: quizQuestion.explanation,
        hint: quizQuestion.hint,
      };

      await prisma.quizQuestion.upsert({
        where: { id: quizQuestion.id },
        update: data,
        create: { id: quizQuestion.id, ...data },
      });

      questionCount += 1;
    }
  }

  const [trackTotal, moduleTotal, quizQuestionTotal] = await Promise.all([
    prisma.track.count(),
    prisma.module.count(),
    prisma.quizQuestion.count(),
  ]);

  console.log(
    `Seed complete: processed ${sortedTracks.length} tracks / ${moduleCount} modules / ` +
      `${questionCount} quiz questions. Database now holds ${trackTotal} track(s), ` +
      `${moduleTotal} module(s), ${quizQuestionTotal} quiz question(s).`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
