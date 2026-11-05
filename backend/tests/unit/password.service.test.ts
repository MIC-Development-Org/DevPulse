import { describe, expect, it } from "vitest";
import { getArgon2Params, hashPassword, verifyPassword } from "../../src/services/password.service";

describe("password.service (Argon2id)", () => {
  it("produces an Argon2id encoded hash and verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    await expect(verifyPassword(hash, "correct horse battery staple")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("the-right-password");
    await expect(verifyPassword(hash, "the-wrong-password")).resolves.toBe(false);
  });

  it("embeds the configured parameters in each hash string", async () => {
    const params = getArgon2Params();
    const hash = await hashPassword("param-check");
    // $argon2id$v=19$m=<memoryCost>,t=<timeCost>,p=<parallelism>$...
    expect(hash).toContain(
      `$argon2id$v=19$m=${params.memoryCost},t=${params.timeCost},p=${params.parallelism}$`
    );
  });

  it("hashes are salted (two calls differ)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});
