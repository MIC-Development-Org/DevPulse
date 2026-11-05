/**
 * Argon2id benchmark for the current environment (npm run bench:argon2).
 *
 * Measures hash + verify latency with the configured (or default OWASP)
 * parameters. Re-run on the production container image before tuning:
 * the numbers below record THIS machine only. Target ≈ 250 ms hash /
 * ≈ 125 ms verify for interactive login workloads.
 *
 * Prints no secrets — it hashes throwaway strings.
 */
import { performance } from "node:perf_hooks";
import { Algorithm, hash, verify } from "@node-rs/argon2";
import { env } from "../src/config/env";

const RUNS = 5;
const SAMPLE = "benchmark-sample-password-#%42";

async function main(): Promise<void> {
  console.log("Argon2id parameters:");
  console.log({
    algorithm: "argon2id",
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  });

  const options = {
    algorithm: Algorithm.Argon2id,
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  };

  // Warm-up (JIT, page cache, allocator)
  const encoded = await hash(SAMPLE, options);
  await verify(encoded, SAMPLE);

  const hashTimes: number[] = [];
  const verifyTimes: number[] = [];
  let lastEncoded = "";
  let lastSample = "";

  for (let i = 0; i < RUNS; i++) {
    lastSample = `${SAMPLE}-${i}`;
    let start = performance.now();
    lastEncoded = await hash(lastSample, options);
    hashTimes.push(performance.now() - start);

    start = performance.now();
    const ok = await verify(lastEncoded, lastSample);
    if (!ok) throw new Error("Benchmark verification unexpectedly failed");
    verifyTimes.push(performance.now() - start);
  }

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  console.log(`hash   × ${RUNS}: ${hashTimes.map((t) => t.toFixed(0)).join(", ")} ms`); 
  console.log(`verify × ${RUNS}: ${verifyTimes.map((t) => t.toFixed(0)).join(", ")} ms`);
  console.log(
    `avg hash   ≈ ${avg(hashTimes).toFixed(1)} ms | avg verify ≈ ${avg(verifyTimes).toFixed(1)} ms`
  );
  console.log("encoded prefix:", lastEncoded.split("$").slice(0, 4).join("$"), "$...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
