import { describe, expect, it } from "vitest";
import {
  activityIntensityFor,
  computeStreakDays,
  defaultAvatarUrl,
  deriveActivityWindow,
  isModuleUnlockedByChain,
  utcIsoDate,
  type UnlockChain,
} from "../../src/services/progress.service";

/**
 * Pure policy-math tests (Phase 5): streak windows, activity intensities, and
 * the D2 unlock-chain rule. No database involved — these are the
 * deterministic rules the DB-backed composition services call into.
 */

const DAY = 86_400_000;
const NOW = new Date("2026-11-06T12:00:00.000Z"); // a fixed Friday noon UTC
const daysBeforeNow = (n: number) => new Date(NOW.getTime() - n * DAY);

describe("utcIsoDate", () => {
  it("produces UTC calendar-day keys", () => {
    expect(utcIsoDate(new Date("2026-11-06T23:59:59.999Z"))).toBe("2026-11-06");
    expect(utcIsoDate(new Date("2026-11-07T00:00:00.000Z"))).toBe("2026-11-07");
    expect(utcIsoDate(new Date("2026-11-06T00:30:00.000+02:00"))).toBe("2026-11-05");
  });
});

describe("activityIntensityFor", () => {
  it("maps event counts to the documented 0..4 buckets", () => {
    expect(activityIntensityFor(0)).toBe(0);
    expect(activityIntensityFor(1)).toBe(1);
    expect(activityIntensityFor(2)).toBe(2);
    expect(activityIntensityFor(3)).toBe(2);
    expect(activityIntensityFor(4)).toBe(3);
    expect(activityIntensityFor(6)).toBe(3);
    expect(activityIntensityFor(7)).toBe(4);
    expect(activityIntensityFor(50)).toBe(4);
  });
});

describe("computeStreakDays", () => {
  it("counts a consecutive run ending today", () => {
    const dates = [daysBeforeNow(0), daysBeforeNow(1), daysBeforeNow(2)];
    expect(computeStreakDays(dates, NOW)).toBe(3);
  });

  it("gracefully counts a streak that ended yesterday", () => {
    const dates = [daysBeforeNow(1), daysBeforeNow(2), daysBeforeNow(3)];
    expect(computeStreakDays(dates, NOW)).toBe(3);
  });

  it("reads 0 when the last activity is 2+ days old", () => {
    const dates = [daysBeforeNow(2), daysBeforeNow(3)];
    expect(computeStreakDays(dates, NOW)).toBe(0);
  });

  it("reads 0 with no events at all (no fabricated activity)", () => {
    expect(computeStreakDays([], NOW)).toBe(0);
  });

  it("collapses multiple events on the same day into one streak day", () => {
    const sameDay = [
      new Date("2026-11-06T01:00:00.000Z"),
      new Date("2026-11-06T09:00:00.000Z"),
      new Date("2026-11-05T22:00:00.000Z"),
    ];
    expect(computeStreakDays(sameDay, NOW)).toBe(2);
  });
});

describe("deriveActivityWindow", () => {
  it("returns exactly 112 keyed days ending today", () => {
    const record = deriveActivityWindow([], NOW);
    const keys = Object.keys(record);
    expect(keys).toHaveLength(112);
    expect(keys.at(-1)).toBe("2026-11-06");
    expect(keys[0]).toBe(utcIsoDate(daysBeforeNow(111)));
  });

  it("ranks busy days and defaults empty ones to 0", () => {
    const record = deriveActivityWindow(
      [daysBeforeNow(0), daysBeforeNow(0), daysBeforeNow(0), daysBeforeNow(1)],
      NOW
    );
    expect(record["2026-11-06"]).toBe(2); // 3 events today (2..3 -> intensity 2)
    expect(record["2026-11-05"]).toBe(1); // 1 event yesterday
    expect(record[utcIsoDate(daysBeforeNow(2))]).toBe(0);
  });
});

describe("isModuleUnlockedByChain (D2)", () => {
  const chainOf = (
    trackModules: { id: string; position: number }[],
    bankedIds: string[],
    completedIds: string[]
  ): UnlockChain => ({
    trackModules: trackModules as UnlockChain["trackModules"],
    bankedIds: new Set(bankedIds),
    completedIds: new Set(completedIds),
  });

  it("unlocks the first module for everyone", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "m2", position: 1 },
      ],
      ["m1"],
      []
    );
    expect(isModuleUnlockedByChain(chain, "m1")).toBe(true);
  });

  it("keeps later modules locked until the banked module completes", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "m2", position: 1 },
      ],
      ["m1"],
      []
    );
    expect(isModuleUnlockedByChain(chain, "m2")).toBe(false);
  });

  it("unlocks the next module once the banked module is COMPLETED", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "m2", position: 1 },
        { id: "m3", position: 2 },
      ],
      ["m1"],
      ["m1"]
    );
    expect(isModuleUnlockedByChain(chain, "m2")).toBe(true);
    // Unbanked m2 sits between m1 and m3: the bridge is skipped, so m3
    // unlocks together with m2 (D2 — unbanked modules never block).
    expect(isModuleUnlockedByChain(chain, "m3")).toBe(true);
  });

  it("skips unbanked bridges: they never block and never complete", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "bridge", position: 1 },
        { id: "m2", position: 2 },
      ],
      ["m1"],
      ["m1"]
    );
    expect(isModuleUnlockedByChain(chain, "bridge")).toBe(true);
    expect(isModuleUnlockedByChain(chain, "m2")).toBe(true);
  });

  it("an unfinished banked module before the target blocks it", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "m2", position: 1 },
        { id: "m3", position: 2 },
        { id: "m4", position: 3 },
      ],
      ["m1", "m3"],
      ["m1"]
    );
    expect(isModuleUnlockedByChain(chain, "m3")).toBe(true); // reachable, banked, not done
    expect(isModuleUnlockedByChain(chain, "m4")).toBe(false); // blocked by m3
  });

  it("completed modules stay unlocked even mid-chain", () => {
    const chain = chainOf(
      [
        { id: "m1", position: 0 },
        { id: "m2", position: 1 },
      ],
      ["m1"],
      ["m2"]
    );
    expect(isModuleUnlockedByChain(chain, "m2")).toBe(true);
  });
});

describe("defaultAvatarUrl", () => {
  it("builds a deterministic inline SVG (no external fetches, no fake photos)", () => {
    const url = defaultAvatarUrl("Alex");
    expect(url.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(url).includes("<svg")).toBe(true);
    expect(defaultAvatarUrl("Alex")).toBe(url);
  });
});
