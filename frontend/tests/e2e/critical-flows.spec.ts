import { test, expect } from "@playwright/test";

test.describe("DevPulse Critical Learning Flows", () => {
  test("1. Landing page loads and navigates to curriculum", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("From packet transport");

    // Click Explore Curriculum
    await page.click("text=Explore Curriculum");
    await expect(page).toHaveURL("/learn");
    await expect(page.locator("h1")).toContainText("Engineering Learning Tracks");
  });

  test("2. Track Trail displays module nodes and states", async ({ page }) => {
    await page.goto("/learn/web-foundations");
    await expect(page.locator("h1")).toContainText("Web Foundations");

    // Verify presence of Module 0.5 Git Basics
    await expect(page.getByRole("heading", { name: "5. Git Basics & Object Model" })).toBeVisible();
  });

  test("3. Module Reader loads interactive Git Visualiser and TOC", async ({ page }) => {
    await page.goto("/learn/web-foundations/git-basics");
    await expect(page.locator("h1")).toContainText("Git Basics & Object Model");

    // Table of Contents
    await expect(page.locator("nav[aria-label='Table of contents']")).toBeVisible();

    // Git Visualiser Live DAG Section
    await expect(page.getByRole("heading", { name: "3. Interactive Git Visualiser" })).toBeVisible();
    await expect(page.locator("text=git terminal session")).toBeVisible();

    // Verify practice task toggle
    const practiceBtn = page.locator("text=Mark Practice Task Complete");
    if (await practiceBtn.isVisible()) {
      await practiceBtn.click();
      await expect(page.locator("text=Completed Practice Task")).toBeVisible();
    }
  });

  test("4. Quiz Player handles questions, keyboard navigation and submission", async ({ page }) => {
    await page.goto("/learn/web-foundations/git-basics/quiz");
    await expect(page.locator("text=80% PASS THRESHOLD")).toBeVisible();

    // Question 1 should be visible
    await expect(page.locator("text=Question 1 of")).toBeVisible();

    // Select first option using keyboard '1'
    await page.keyboard.press("1");

    // Click next question
    await page.click("text=Next Question");
    await expect(page.locator("text=Question 2 of")).toBeVisible();
  });

  test("5. Certificates directory filters by category and search", async ({ page }) => {
    await page.goto("/certificates");
    await expect(page.locator("h1")).toContainText("Industry Certification Resources");

    // Search for "Git"
    await page.fill("input[placeholder*='Search']", "Git");
    await expect(page.locator("text=The Linux Foundation")).toBeVisible();

    // Clear search and filter by Blockchain
    await page.fill("input[placeholder*='Search']", "");
    await page.click("button:has-text('Blockchain')");
    await expect(page.locator("text=Ethereum Developer Bootcamp")).toBeVisible();
  });
});
