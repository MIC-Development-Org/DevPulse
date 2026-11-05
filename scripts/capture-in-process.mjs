import http from "http";
import next from "next";
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishan/.gemini/antigravity/brain/a1c5b7ba-4aa4-44eb-a825-d6156b7dadfc/screenshots";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log("Preparing Next.js app in-process...");
  const dev = false;
  const hostname = "127.0.0.1";
  const port = 3001;

  const app = next({ dev, hostname, port, dir: process.cwd() });
  const handle = app.getRequestHandler();

  await app.prepare();
  console.log("Next.js app prepared!");

  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  await new Promise((resolve) => server.listen(port, hostname, resolve));
  console.log(`Server listening on http://${hostname}:${port}`);

  try {
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
        await page.goto(`http://${hostname}:${port}${route.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        const filename = `${route.name}-${vp.name}-dark.png`;
        const filepath = path.join(ARTIFACT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`    -> Saved ${filename}`);

        // For desktop, also capture light mode for all screens
        if (vp.name === "desktop") {
          await page.evaluate(() => {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
          });
          await page.waitForTimeout(400);
          const lightFilename = `${route.name}-desktop-light.png`;
          const lightFilepath = path.join(ARTIFACT_DIR, lightFilename);
          await page.screenshot({ path: lightFilepath, fullPage: false });
          console.log(`    -> Saved ${lightFilename}`);

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
    server.close();
    console.log("In-process server closed.");
  }
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

