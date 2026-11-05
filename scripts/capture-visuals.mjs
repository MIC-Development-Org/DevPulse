import { chromium } from "@playwright/test";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishan/.gemini/antigravity/brain/a1c5b7ba-4aa4-44eb-a825-d6156b7dadfc/screenshots";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) return true;
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error("Server failed to start within timeout");
}

async function main() {
  console.log("Starting Next.js production server on port 3000...");
  const server = spawn("npx", ["next", "start", "-p", "3000"], {
    stdio: "inherit",
    shell: true,
  });

  try {
    await waitForServer("http://localhost:3000");
    console.log("Next.js server is ready!");

    const browser = await chromium.launch({ headless: true });

    const viewports = [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 812 },
    ];

    const routes = [
      { path: "/", name: "landing" },
      { path: "/dashboard", name: "dashboard" },
      { path: "/learn", name: "learn-overview" },
      { path: "/learn/web-foundations", name: "track-trail" },
      { path: "/learn/web-foundations/git-basics", name: "module-reader" },
      { path: "/learn/web-foundations/git-basics/quiz", name: "quiz-player" },
      { path: "/certificates", name: "certificates" },
      { path: "/profile", name: "profile" },
      { path: "/storybook", name: "component-catalog" },
    ];

    for (const vp of viewports) {
      console.log(`\nCapturing viewports for: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      for (const route of routes) {
        console.log(`  Visiting ${route.path}...`);
        await page.goto(`http://localhost:3000${route.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600); // Allow animations to settle

        const filename = `${route.name}-${vp.name}-dark.png`;
        const filepath = path.join(ARTIFACT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`    -> Saved ${filename}`);

        // For desktop, also capture light mode
        if (vp.name === "desktop" && ["landing", "module-reader", "dashboard", "quiz-player"].includes(route.name)) {
          // Toggle to light theme
          await page.evaluate(() => {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
          });
          await page.waitForTimeout(400);
          const lightFilename = `${route.name}-desktop-light.png`;
          const lightFilepath = path.join(ARTIFACT_DIR, lightFilename);
          await page.screenshot({ path: lightFilepath, fullPage: false });
          console.log(`    -> Saved ${lightFilename}`);

          // Restore dark theme
          await page.evaluate(() => {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
          });
        }
      }
      await context.close();
    }

    await browser.close();
    console.log("\nAll visual screenshots successfully captured to artifact directory!");
  } finally {
    console.log("Shutting down Next.js server...");
    server.kill();
  }
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});

