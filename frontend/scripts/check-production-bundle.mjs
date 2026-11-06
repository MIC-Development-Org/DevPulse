#!/usr/bin/env node
/**
 * Production artifact scanner (Phase 5, approved decision D6).
 *
 * WHY THIS EXISTS
 *   The browser may NEVER learn a quiz answer key. Phase 4's build leaked
 *   QUIZ_BANKS into `static/chunks/*.js` because the adapter's env read lived
 *   in a cross-module (selection.ts) so SWC could not constant-fold the mock
 *   branch — the mock stack (including the in-browser "grading" simulation
 *   and every correctOptionIndex) shipped to real users. Assertions alone do
 *   not prove absence; the SHIPPED ARTIFACTS decide.
 *
 * WHAT IT DOES
 *   Scans every Next.js client artifact under `.next/static` (chunks, CSS is
 *   irrelevant but harmless to include) for tokens that must be impossible
 *   in a production build built with NEXT_PUBLIC_API_MOCK=false:
 *
 *     1. `correctOptionIndex`  — the answer-key property of the authored banks
 *     2. `q-05-1`, `q-13-1`    — bank question ids (only mock/bank code uses them)
 *     3. a bank-only literal    — the stored mock-grading localStorage key
 *                                 (`devpulse_user_profile_v1`) whose presence
 *     would prove the mock stack survived tree-shaking
 *
 *   A sanity check requires evidence that the build is actually the live
 *   hybrid one: at least one chunk must reference the BFF business routes.
 *
 * USAGE
 *   Run AFTER a production build:
 *     npm run build && node scripts/check-production-bundle.mjs
 *   (wired as `npm run verify:production` — the Phase 5 production gate).
 *
 * EXIT CODES
 *   0 — clean artifacts; 1 — leak detected or inconclusive build.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { extname, join, relative } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const STATIC_DIR = join(ROOT, ".next", "static");

/** Token list: answer keys + proven mock-stack markers (keys, ids, storage). */
const FORBIDDEN_TOKENS = [
  // 1) The answer-key property from QuizQuestion contracts/banks:
  "correctOptionIndex",
  // 2) Authored bank question ids (first question of each banked module):
  "q-05-1",
  "q-13-1",
  // 3) The mock client's localStorage namespace — its presence proves the
  //    in-browser grading stack survived dead-code elimination:
  "devpulse_user_profile_v1",
];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (extname(full) === ".js") {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error(
      "[check-production-bundle] No .next/static artifacts found. Run `npm run build` (NEXT_PUBLIC_API_MOCK should NOT be 'true') first."
    );
    process.exit(1);
  }

  const chunks = walk(STATIC_DIR);
  if (chunks.length === 0) {
    console.error("[check-production-bundle] No .js client chunks found under .next/static.");
    process.exit(1);
  }

  // Sanity: the artifacts must belong to a live-API (hybrid) build. The BFF
  // business paths are hard-coded in http-api-client; mock-mode builds never
  // reference them.
  const liveEvidence = chunks.some((file) =>
    readFileSync(file, "utf8").includes("/api/business/")
  );
  if (!liveEvidence) {
    console.error(
      "[check-production-bundle] Artifacts do not reference /api/business/* — this does not look like a NEXT_PUBLIC_API_MOCK=false production build. Aborting (inconclusive, not pass)."
    );
    process.exit(1);
  }

  const offenders = [];
  for (const file of chunks) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue; // unreadable artifact (binary/permission) — skip, chunks are text
    }
    for (const token of FORBIDDEN_TOKENS) {
      if (content.includes(token)) {
        offenders.push({ file: relative(ROOT, file), token });
      }
    }
  }

  if (offenders.length > 0) {
    console.error(
      "[check-production-bundle] LEAK DETECTED — grading truth reached the client bundle:"
    );
    for (const { file, token } of offenders) {
      console.error(`  - ${file} contains "${token}"`);
    }
    console.error(
      "[check-production-bundle] Fix: keep the mock stack inside the folded adapter branch (adapter.ts inlines NEXT_PUBLIC_API_MOCK), keep modules side-effect-free, and never re-export QUIZ_BANKS from mock-data."
    );
    process.exit(1);
  }

  console.log(
    `[check-production-bundle] OK — ${chunks.length} client chunk(s) scanned; no answer keys, no bank ids, no mock-grading markers. Production bundle clean.`
  );
}

main();
