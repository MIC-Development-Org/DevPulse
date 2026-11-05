import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Structural guard: the production backend must contain no demo/bypass
 * authentication code. Fake logins are how breaches happen — so instead of
 * trusting reviewers, this test scans the source for forbidden patterns and
 * fails the suite if any appear (including in tests themselves is fine there,
 * these paths are src-only).
 */
function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (full.endsWith(".ts")) files.push(full);
  }
  return files;
}

describe("no demo/bypass authentication in backend src", () => {
  const srcRoot = join(__dirname, "..", "..", "src");

  it("contains no demo bypass code paths", () => {
    const forbidden = [/DEMO_[A-Z]/, /demoLogin/, /auth[/\\]demo/, /bypass/i];
    const offenders: string[] = [];

    for (const file of walk(srcRoot)) {
      const content = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        if (pattern.test(content)) offenders.push(`${file} -> ${pattern}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
