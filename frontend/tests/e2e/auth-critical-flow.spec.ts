import { test, expect } from "@playwright/test";

/**
 * Phase 2 authentication critical flow (e2e).
 *
 * Exercises the real chain: browser → Next BFF/Auth.js (database sessions) →
 * Express (/auth/*) → PostgreSQL — same Docker database as development.
 *
 * Each run uses a unique email; users created here stay in the dev database
 * (documented limitation — no DB cleanup endpoint exists by design).
 */

// Unique-per-run email (HTML5 email inputs reject "+", so use dashes).
const email = `e2e-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@integration-test.dev`;
const password = "e2e-strong-pass-01";

test.describe("authentication critical flow", () => {
  test("register → auto sign-in → protected dashboard → sign out", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[type="text"]', "E2E Auth Tester");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Registration → BFF → Express (Argon2id) → Auth.js session → redirect.
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard/);

    // The session token must be HttpOnly — browser JS must not see it.
    const documentCookie = await page.evaluate(() => document.cookie);
    expect(documentCookie).not.toMatch(/session-token/i);

    // /api/auth/session must never echo the token or the password hash.
    const sessionBody = await page.evaluate(async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    });
    expect(JSON.stringify(sessionBody)).not.toMatch(/sessionToken|passwordHash|argon2/);

    // Navbar session-awareness: avatar reflects the signed-in identity.
    await expect(
      page.locator('header [aria-label^="Signed in as"]')
    ).toBeVisible();

    // Sign out — session row deleted server-side, cookie cleared.
    await page.locator('button[aria-label="Sign out"]').click();
    await page.waitForURL(/\/(learn|$)/, { timeout: 15_000 });

    // Protected route after logout: /dashboard must redirect to /login.
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 15_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("duplicate email registration shows the generic conflict message", async ({ page }) => {
    // Occasion the email exactly once via the real signup flow.
    const emailForDup = `e2e-dup-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@integration-test.dev`;

    await page.goto("/signup");
    await page.fill('input[type="text"]', "E2E Dup");
    await page.fill('input[type="email"]', emailForDup);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30_000 });

    // Sign out so we can attempt re-registration.
    await page.locator('button[aria-label="Sign out"]').click();
    await page.waitForURL(/\/(learn|$)/, { timeout: 15_000 });

    await page.goto("/signup");
    await page.fill('input[type="text"]', "E2E Dup");
    await page.fill('input[type="email"]', emailForDup);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await expect(
      page.getByText("This email cannot be used to create an account", { exact: false })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("invalid credentials produce the generic login error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', email); // exists from previous test? no — unique run scope; unknown also yields the same generic error
    await page.fill('input[type="password"]', "definitely-wrong-pass");
    await page.click('button[type="submit"]');

    // Backend returns the message without a trailing period.
    await expect(
      page.getByText("Invalid email or password", { exact: false })
    ).toBeVisible({ timeout: 15_000 });
  });
});
