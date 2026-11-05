import { PrismaClient } from "@prisma/client";
import { TRACKS } from "@devpulse/curriculum";

/**
 * Phase 1 seed — curriculum structure only.
 *
 * Source of truth: src/lib/data/mock-data.ts (TrackSchema / ModuleMetaShape).
 * Seeds exactly 3 tracks and 23 modules with the existing stable editorial
 * ids ("track-0", "mod-1-2", ...) so later phases can reference them from
 * progress/attempts logic without a lookup drift.
 *
 * Idempotent: every row is upserted by its primary key, so re-running the
 * seed never creates duplicates — it refreshes slug/title/position/threshold
 * values in place.
 *
 * Deliberately NOT seeded (per Phase 1 scope):
 * - users, quiz attempts, module progress (no fake data)
 * - quiz banks / lesson content / certificates (stay in mock-data.ts)
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

  const [trackTotal] = await Promise.all([
    prisma.track.count(),
    prisma.module.count(),
  ]);

  console.log(
    `Seed complete: processed ${sortedTracks.length} tracks / ${moduleCount} modules. ` +
      `Database now holds ${trackTotal} track(s).`
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
